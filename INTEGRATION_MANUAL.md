# Cloudflare Integration Manual (GitHub Deployment)

This guide explains how to deploy your **Event Photo Uploader** integration using GitHub and Cloudflare.

## Prerequisites

1.  **Cloudflare Account**: [Sign up here](https://dash.cloudflare.com/sign-up).
2.  **GitHub Repository**: Your code should be pushed to GitHub.
3.  **Wrangler CLI**: `npm install -g wrangler`.

---

## Step 1: Push Code to GitHub

Ensure your latest changes (including the new `ImageUploader` component and `api.js` adjustments) are committed and pushed to your `Wedding_SPA` repository.

```bash
git add .
git commit -m "Integrate photo uploader"
git push origin main
```

---

## Step 2: Set up Cloudflare R2 (Storage)

1.  Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **R2**.
2.  Click **Create Bucket**.
3.  Name it: **`event-photos`** (This matches your `wrangler.toml`).
4.  Click **Create Bucket**.
5.  **Settings**: In the bucket settings, verify "Public Access" is configured if you need to view images publicly, or keep it private if only the Worker accesses it.

---

## Step 3: Deploy the Backend (Worker)

*Note: The backend code currently lives in `event-photo-uploader/backend`. You can keep it there or move it into your main repo.*

1.  Navigate to the backend directory:
    ```bash
    cd event-photo-uploader/backend
    ```
2.  Deploy using Wrangler (easiest method):
    ```bash
    npx wrangler deploy
    ```
    *This creates the worker `event-photo-uploader-backend` on your account.*
3.  **Copy the Worker URL** from the output (e.g., `https://event-photo-uploader-backend.<your-subdomain>.workers.dev`).

---

## Step 4: Configure Frontend Deployment (Cloudflare Pages)

1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Compute (Workers & Pages)** > **Pages**.
2.  Click **Connect to Git**.
3.  Select your **`Wedding_SPA`** repository.
4.  **Configure Build Settings**:
    *   **Project Name**: `wedding-spa`
    *   **Production Branch**: `main`
    *   **Framework Preset**: `Vue` or `Vite`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  **Environment Variables (Crucial!)**:
    *   Click "Environment Variables (Advanced)".
    *   **Variable Name**: `VITE_API_URL`
    *   **Value**: Your Worker URL from Step 3 + `/upload`  
        (Example: `https://event-photo-uploader-backend.yourname.workers.dev/upload`)
6.  Click **Save and Deploy**.

---

## Step 5: Verify Production

1.  Wait for the Cloudflare Pages build to complete (it will install dependencies and build your Vue app).
2.  Visit the **Pages URL** (e.g., `https://wedding-spa.pages.dev`).
3.  **Test**: Tap "Take Photo" and upload an image.
4.  **Verify**: Check your `test-wedding-bucket` in R2 to see the new file!

---

### Troubleshooting

*   **Upload Fails?**
    *   Check the browser console (Network Tab). If the request goes to `localhost`, your `VITE_API_URL` environment variable wasn't set correctly in Cloudflare Pages.
    *   If it returns `403/401`, check your Worker's logic or R2 bindings.
*   **Component Not Visible?**
    *   Ensure you pushed the correctly updated `App.vue` and `src/components/` files to GitHub.
