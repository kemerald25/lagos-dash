# Lagos Dash on Vercel (for Lagos Life)

```
public/index.html      the game (served at /)
api/*.js               serverless functions: profile, save, gem-found, spend-gem, claim, vatar-webhook
lib/core.js            shared code (Vatar API checks, Redis helper)
vercel.json            sends the frame-ancestors header Lagos Life requires
```

## Deploy
1. Put this folder in a GitHub repo (the folder itself is the project root) and import it in Vercel.
   Framework Preset: **Other**. No build command. Leave Output Directory empty (it uses `public`).
2. In the Vercel project, open **Storage** and add **Upstash Redis** (Marketplace). It adds its REST URL and token as
   environment variables automatically (`UPSTASH_REDIS_REST_*` or `KV_REST_API_*`; both are supported). If neither appears, add them by hand.
3. Add environment variables **VATAR_SECRET** and **VATAR_WEBHOOK_SECRET** (test values first, live ones after approval), then redeploy.
4. In the Vatar dashboard:
   - Game address: your production URL, e.g. `https://your-project.vercel.app`
   - Webhook: `https://your-project.vercel.app/api/vatar-webhook`
   - Products (consumable): `gem_1` (₦100) and `gem_5` (₦400)
5. Play it in the sandbox and tick the checklist.

## Gotchas
- Use the **production** URL. If it asks for a Vercel login, turn off Deployment Protection for it, or Lagos Life's frame can't load it.
- Don't add `X-Frame-Options` (the header in `vercel.json` already allows Lagos Life).
- Rotating a Vatar secret in the dashboard invalidates the old one at once: update the env var and redeploy.
