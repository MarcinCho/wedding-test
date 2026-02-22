# Wedding SPA

A modern Single Page Application for wedding photo sharing, built with Vue 3, Vite, Tailwind CSS, and Cloudflare Pages & R2.

## Features Implemented

*   **Photo Uploads:**
    *   Guest name & device ID tracking (saves to `localStorage`).
    *   Drag and drop support or file selection.
    *   Client-side image compression before upload (using `browser-image-compression`).
    *   Direct upload to Cloudflare R2 bucket (`event-photos`) via Cloudflare Pages Functions (`/api/upload`).
    *   Progress bars for individual files and total upload progress.
*   **Photo Gallery ("My Photos"):**
    *   Users can view only the photos they uploaded, tracked by their device ID.
    *   Lazy loading of images for performance.
    *   "Manage" mode to easily delete photos.
*   **Photo Deletion:**
    *   Users can delete their own uploaded photos from the R2 bucket.
    *   Optimistic UI updates for instant feedback.
*   **Backend (Cloudflare Pages Functions):**
    *   `/api/upload`: Handles multipart form data, generating unique filenames, and storing the file in R2 with custom metadata (uploader name, device ID).
    *   `/api/my-photos`: Retrieves a list of objects from R2 filtered by the user's device ID (using custom metadata).
    *   `/api/images/[[path]]`: Serves the images directly from the R2 bucket to the frontend securely.
    *   `/api/delete`: Deletes a specific object from the R2 bucket.
*   **Styling:**
    *   Tailwind CSS v4 for responsive, modern styling.
    *   Custom theme colors (light pink/purple).

## Prerequisites

*   Node.js (v18+ recommended)
*   npm or pnpm
*   Wrangler CLI (`npm install -g wrangler`)
*   A Cloudflare account with R2 enabled.

## Setup Instructions

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Cloudflare R2 Setup:**
    *   Create an R2 bucket named `event-photos`.
    *   Ensure your `wrangler.toml` is configured correctly:
        ```toml
        name = "wedding-spa-v2"
        compatibility_date = "2024-09-23"
        pages_build_output_dir = "dist"

        [[r2_buckets]]
        binding = "EVENT_PHOTOS_BUCKET"
        bucket_name = "event-photos"
        preview_bucket_name = "event-photos"
        ```

3.  **Local Development:**
    To run the app and the Cloudflare Pages Functions locally, you *must* use Wrangler to simulate the Cloudflare environment and provide access to your R2 bucket.

    ```bash
    npm run build # You must build the Vue app first so Wrangler can serve the static assets
    wrangler pages dev dist --binding EVENT_PHOTOS_BUCKET=event-photos
    ```
    *Note: The first time you run this, you may be prompted to log in to Cloudflare.*

    Alternatively, to view the frontend changes with hot-module replacement (HMR), you can run `npm run dev` (Vite dev server), but the API endpoints (Functions) will not work because Vite doesn't know about `EVENT_PHOTOS_BUCKET`. Always test API interactions using `wrangler pages dev`.

## Deployment

To deploy the application to Cloudflare Pages:

1.  **Build the Project:**
    ```bash
    npm run build
    ```

2.  **Deploy via Wrangler:**
    ```bash
    wrangler pages deploy dist
    ```
    Make sure your Cloudflare Pages project settings have the R2 bucket binding configured properly in the Cloudflare Dashboard (Settings -> Functions -> R2 bucket bindings: Variable name `EVENT_PHOTOS_BUCKET`, attached to the `event-photos` bucket).
