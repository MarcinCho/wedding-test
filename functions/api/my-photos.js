export async function onRequestGet({ request, env }) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        const url = new URL(request.url);
        const deviceId = url.searchParams.get('deviceId');

        if (!deviceId) {
            return new Response(JSON.stringify({ success: false, message: "Missing deviceId" }), { status: 400, headers: corsHeaders });
        }

        const safeDeviceId = deviceId.replace(/[^a-zA-Z0-9-]/g, '');
        const prefix = `uploads/${safeDeviceId}/`;

        if (!env.EVENT_PHOTOS_BUCKET) {
            console.error("Missing EVENT_PHOTOS_BUCKET binding");
            return new Response("Server Configuration Error", { status: 500, headers: corsHeaders });
        }

        const listed = await env.EVENT_PHOTOS_BUCKET.list({ prefix });

        const photos = listed.objects.map(obj => {
            return {
                key: obj.key,
                url: `/api/images/${obj.key}`, // Proxy endpoint we will build
                uploadedAt: obj.customMetadata?.uploadedAt || obj.uploaded
            };
        });

        // Sort completely new photos first
        photos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        return new Response(JSON.stringify({
            success: true,
            photos
        }), {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });

    } catch (err) {
        console.error("Error listing photos:", err);
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
