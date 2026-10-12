import { authed, json, redis, getGems } from "../lib/core.js"
export async function POST(request) {
  try {
    const a = await authed(request); if (a.res) return a.res
    const p = JSON.parse((await redis("GET", "p:" + a.pid)) || "null") || { wallet: 0, owned: ["green"], eq: "green" }
    return json({ gems: await getGems(a.pid), ...p })
  } catch { return json({ error: "error" }, 500) }
}
