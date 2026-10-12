import { signed, fulfill } from "../lib/core.js"
export async function POST(request) {
  try {
    const raw = await request.text()
    if (!signed(raw, request.headers.get("x-vatar-signature"))) return new Response(null, { status: 401 })
    let evt = {}; try { evt = JSON.parse(raw) } catch { }
    if (evt.type === "purchase.paid" && evt.data?.purchaseId) await fulfill(evt.data.purchaseId) // a nudge: fulfill() verifies it
    return new Response(null, { status: 200 })
  } catch (e) { console.error("vatar-webhook", e?.message || e); return new Response(null, { status: 500 }) }  // a non-2xx makes Vatar retry later
}