# Cloudflare Worker setup for this project

Quick guide to run and deploy the Worker that handles the RSVP POST.

1) Install Wrangler (local dev dependency or global)

   - Local (preferred):
     ```bash
     pnpm add -D wrangler
     # or npm: npm install --save-dev wrangler
     ```

   - Global (optional):
     ```bash
     npm install -g wrangler
     ```

2) Configure `wrangler.toml`

   - Open `wrangler.toml` and replace `YOUR_ACCOUNT_ID` with your Cloudflare Account ID.

3) Set secrets

   - Set your Resend API key so the Worker can send emails:
     ```bash
     wrangler secret put RESEND_API_KEY
     # then paste the key when prompted
     ```

4) Local development

   - Start the worker locally:
     ```bash
     pnpm run worker:dev
     # or: npm run worker:dev
     ```

   - The endpoint will be available at the URL printed by Wrangler. Use the path `/api/send-rsvp`.

5) Deploy

   - Publish to Cloudflare workers (workers.dev):
     ```bash
     pnpm run worker:deploy
     # or: npm run worker:deploy
     ```

6) Test with curl

   ```bash
   curl -X POST <WORKER_URL>/api/send-rsvp \
     -H "Content-Type: application/json" \
     -d '{"name":"Jan Kowalski","guestCount":2,"comment":"See you!"}'
   ```

Notes
- The Worker script `worker.js` expects an environment variable `RESEND_API_KEY` (set via `wrangler secret put`).
- If you prefer Cloudflare Pages Functions (already present in `functions/api/send-rsvp.js`), you can keep using that and deploy via Pages; the Worker here is an alternative if you want a standalone Worker endpoint.
