# Deploying Wedding SPA via Wrangler CLI

This guide explains how to manually build and deploy your application directly from your terminal using the Cloudflare `wrangler` CLI. 

This method is an alternative to setting up automatic GitHub deployments and gives you direct control over pushing updates.

## Prerequisites

Ensure you have Node.js and NPM installed, and that you have logged into Wrangler.

1. **Install Wrangler** (if not already installed globally):
   ```bash
   npm install -g wrangler
   ```
2. **Authenticate with Cloudflare**:
   ```bash
   npx wrangler login
   ```
   *This opens a browser window where you authorize Wrangler to access your Cloudflare account.*

---

## Deployment Steps

Whenever you make changes to your code (e.g., updating Vue components, modifying styles, adding images), follow these three steps to push them live:

### 1. Build the Production Files
Before deploying, you must bundle your Vue application into static HTML, CSS, and JS files.

Run the following command in the root of your project:
```bash
npm run build
```
*This command will read your source files and generate an optimized production build inside the `dist/` directory.*

### 2. (Optional) Test Locally 
If you want to verify the production build before pushing it to the internet, you can serve the `dist` folder locally using Cloudflare's preview dev server:
```bash
npx wrangler pages dev dist
```
*Check the output for the localhost URL (usually `http://localhost:8788`), verify your changes, and then stop the server with `Ctrl+C`.*

### 3. Deploy to Cloudflare
Upload the `dist/` directory directly to your Cloudflare Pages project. 

Run:
```bash
npx wrangler pages deploy dist
```

#### What to expect:
*   Wrangler will package the `dist` folder.
*   It will upload only the files that have changed since your last deployment.
*   It also uploads any server-side logic located in `functions/` (such as the `/api/upload.js` photo uploader).
*   **Output:** You will see a success message containing the URL to your live deployment (e.g., `https://<hash>.wedding-spa.pages.dev`).

---

## Notes on Configuration
Your `wrangler.toml` file contains the configuration needed for your R2 photo bucket bindings. When using `npx wrangler pages deploy dist`, Cloudflare automatically reads this file to ensure the bindings (`EVENT_PHOTOS_BUCKET`) are correctly attached to that specific deployment.
