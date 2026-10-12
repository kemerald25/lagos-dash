import { authed, json, fulfill, getGems } from "../lib/core.js"
export async function POST(request) {
  try {
    const a = await authed(request); if (a.res) return a.res
    const r = await fulfill(String(a.body.purchaseId || ""), a.pid)
    return r.err ? json({ error: "claim_failed" }, r.err) : json({ gems: await getGems(a.pid) })
  } catch { return json({ error: "error" }, 500) }
}
