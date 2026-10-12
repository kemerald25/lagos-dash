// Shared helpers for the Lagos Dash API on Vercel (no npm packages).
// Storage: Upstash Redis over its REST API (add it from Vercel's Storage / Marketplace tab).
import crypto from "node:crypto"

const API = "https://lagoslife.app/api/games/v1"
const SECRET = process.env.VATAR_SECRET             // vtr_test_... in the sandbox, vtr_live_... once approved
const WHSEC = process.env.VATAR_WEBHOOK_SECRET      // vtr_whsec_test_... / vtr_whsec_live_...
const RURL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

export const PRODUCTS = { gem_1: 1, gem_5: 5 }      // productId -> gems (create both as consumables in the Vatar dashboard)
export const OUTFITS = ["green", "eagles", "school", "ankara", "agbada", "gold"]
export const json = (o, status = 200) => Response.json(o ?? {}, { status })

export async function redis(...cmd) {
  const r = await fetch(RURL, { method: "POST", headers: { Authorization: `Bearer ${RTOK}` }, body: JSON.stringify(cmd) })
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j.result
}

export async function vapi(path, body) {
  try {
    const r = await fetch(API + path, { method: body ? "POST" : "GET", body: body && JSON.stringify(body),
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" } })
    return { http: r.status, ...(await r.json().catch(() => ({}))) }
  } catch { return { http: 502 } }
}

// Who is asking? Every game call carries a fresh session token that Vatar verifies.
export async function authed(request) {
  let body
  try { body = await request.json() } catch { return { res: json({ error: "bad_request" }, 400) } }
  const me = await vapi("/session/verify", { session: body.session })
  if (me.http !== 200) return { res: json({ error: "bad_session" }, 401) }
  return { pid: me.playerId, body }
}

export const getGems = async (pid) => Number(await redis("GET", "g:" + pid)) || 0

// Check the purchase with Vatar, give the gems once per purchase id, mark it delivered.
export async function fulfill(purchaseId, expectPlayer) {
  const p = await vapi(`/purchases/${encodeURIComponent(purchaseId)}`)
  if (p.http !== 200) return { err: p.http === 404 ? 404 : 502, why: "vatar_purchase_" + p.http + (p.error ? ":" + p.error : "") }
  if (expectPlayer && p.playerId !== expectPlayer) return { err: 403, why: "wrong_player" }
  if (p.status === "refunded") return { err: 409, why: "refunded" }
  const n = PRODUCTS[p.productId]
  if (!n) return { err: 422, why: "unknown_product:" + p.productId }
  if ((await redis("SET", "done:" + p.id, "1", "NX")) === "OK") {   // "OK" only the first time
    try { await redis("INCRBY", "g:" + p.playerId, String(n)) } catch (e) { await redis("DEL", "done:" + p.id); throw e }
  }
  let delivered = p.status === "delivered", dhttp = 200
  if (!delivered) {
    const d = await vapi(`/purchases/${p.id}/deliver`, {}) // if this fails, purchases() brings it back next time
    dhttp = d.http; delivered = d.http === 200
    if (!delivered) console.error("deliver failed", d.http, d.error, d.message)
  }
  return { playerId: p.playerId, delivered, dhttp }
}

/** X-Vatar-Signature: "sha256=" + hex HMAC-SHA256 of the raw body, keyed with the webhook signing secret */
export function signed(raw, header) {
  if (!WHSEC) return false
  const want = Buffer.from("sha256=" + crypto.createHmac("sha256", WHSEC).update(raw).digest("hex"))
  const got = Buffer.from(String(header ?? ""))
  return want.length === got.length && crypto.timingSafeEqual(want, got)
}