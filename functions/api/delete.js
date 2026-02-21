export async function onRequestDelete({ request, env }) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        const url = new URL(request.url);
        const key = url.searchParams.get('key');
        const deviceId = url.searchParams.get('deviceId');

        if (!key || !deviceId) {
            return new Response("Missing parameters", { status: 400, headers: corsHeaders });
        }

        // Security check: The key must start with 'uploads/{deviceId}/'
        // This ensures a guest can ONLY delete files from their own folder.
        const safeDeviceId = deviceId.replace(/[^a-zA-Z0-9-]/g, '');
        const expectedPrefix = `uploads/${safeDeviceId}/`;

        if (!key.startsWith(expectedPrefix)) {
            return new Response("Unauthorized deletion attempt", { status: 403, headers: corsHeaders });
        }

        if (!env.EVENT_PHOTOS_BUCKET) {
            console.error("Missing EVENT_PHOTOS_BUCKET binding");
            return new Response("Server Configuration Error", { status: 500, headers: corsHeaders });
        }

        await env.EVENT_PHOTOS_BUCKET.delete(key);

        return new Response(JSON.stringify({ success: true, message: "Photo deleted" }), {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });

    } catch (err) {
        console.error("Delete error:", err);
        return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
