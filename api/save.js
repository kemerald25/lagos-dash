import { authed, json, redis, OUTFITS } from "../lib/core.js"
export async function POST(request) {
  try {
    const a = await authed(request); if (a.res) return a.res
    const w = Number(a.body.wallet)
    const owned = [...new Set(["green", ...(Array.isArray(a.body.owned) ? a.body.owned : []).filter((x) => OUTFITS.includes(x))])]
    const p = { wallet: Number.isFinite(w) ? Math.max(0, Math.min(1e7, Math.floor(w))) : 0, owned, eq: owned.includes(a.body.eq) ? a.body.eq : "green" }
    await redis("SET", "p:" + a.pid, JSON.stringify(p))
    return json({})
  } catch (e) { console.error("save", e?.message || e); return json({ error: "error" }, 500) }
}