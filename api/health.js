import { redis, json } from "../lib/core.js"
// Open /api/health in your browser to see what is missing. It shows only yes/no, never the values.
export async function GET() {
  const has = (...k) => k.some((x) => !!process.env[x])
  const out = {
    VATAR_SECRET: has("VATAR_SECRET"),
    VATAR_WEBHOOK_SECRET: has("VATAR_WEBHOOK_SECRET"),
    redisUrl: has("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"),
    redisToken: has("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"),
  }
  try { out.redisPing = (await redis("PING")) === "PONG" } catch (e) { out.redisPing = false; out.redisError = String(e?.message || e).slice(0, 120) }
  return json(out)
}