import { authed, json, fulfill, getGems } from "../lib/core.js"
export async function POST(request) {
  try {
    const a = await authed(request); if (a.res) return a.res
    const r = await fulfill(String(a.body.purchaseId || ""), a.pid)
    if (r.err) return json({ error: "claim_failed", why: r.why }, r.err)
    return json({ gems: await getGems(a.pid), delivered: r.delivered, dhttp: r.dhttp })
  } catch (e) { console.error("claim", e?.message || e); return json({ error: "error", why: String(e?.message || e).slice(0, 100) }, 500) }
}