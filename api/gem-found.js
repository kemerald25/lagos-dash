import { authed, json, redis, getGems } from "../lib/core.js"
// Free gems from the road: one every 30 s and 2 a day at most, counted here, so they can't replace buying.
export async function POST(request) {
  try {
    const a = await authed(request); if (a.res) return a.res
    let counted = false
    if ((await redis("SET", "fgap:" + a.pid, "1", "NX", "EX", "30")) === "OK") {
      const key = `fn:${a.pid}:${new Date().toISOString().slice(0, 10)}`
      const n = await redis("INCR", key)
      if (n === 1) await redis("EXPIRE", key, "172800")
      if (n <= 2) { await redis("INCR", "g:" + a.pid); counted = true }
    }
    return json({ gems: await getGems(a.pid), counted })
  } catch { return json({ error: "error" }, 500) }
}
