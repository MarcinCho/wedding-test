export async function onRequestGet({ request, env, params }) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        // params.path is an array of the path segments after /api/images/
        // e.g. /api/images/uploads/device-id/123.jpg -> ['uploads', 'device-id', '123.jpg']
        if (!params.path || params.path.length === 0) {
            return new Response("Not Found", { status: 404, headers: corsHeaders });
        }

        const objectKey = params.path.join('/');

        if (!env.EVENT_PHOTOS_BUCKET) {
            console.error("Missing EVENT_PHOTOS_BUCKET binding");
            return new Response("Server Configuration Error", { status: 500, headers: corsHeaders });
        }

        const object = await env.EVENT_PHOTOS_BUCKET.get(objectKey);

        if (object === null) {
            return new Response("Image Not Found", { status: 404, headers: corsHeaders });
        }

        const headers = new Headers(corsHeaders);

        // Ensure browser caches the images heavily since they are immutable
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        // Pass the object's body directly
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        return new Response(object.body, {
            headers,
            status: 200
        });

    } catch (err) {
        console.error("Image proxy error:", err);
        return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
