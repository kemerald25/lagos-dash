import { authed, json, redis } from "../lib/core.js"
export async function POST(request) {
  try {
    const a = await authed(request); if (a.res) return a.res
    const n = await redis("DECR", "g:" + a.pid)
    if (n < 0) { await redis("INCR", "g:" + a.pid); return json({ error: "no_gems" }, 402) }
    return json({ gems: n })
  } catch (e) { console.error("spend-gem", e?.message || e); return json({ error: "error" }, 500) }
}