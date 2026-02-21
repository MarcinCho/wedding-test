export async function onRequestPost({ request, env }) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        const contentType = request.headers.get("Content-Type");
        if (!contentType || !contentType.startsWith("multipart/form-data")) {
            return new Response("Invalid Content-Type", { status: 400, headers: corsHeaders });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const guestName = formData.get("guestName") || "Unknown Guest";
        const deviceId = formData.get("deviceId") || "unknown-device";

        if (!file) {
            return new Response("No file uploaded", { status: 400, headers: corsHeaders });
        }

        // Validation
        if (file.size > 10 * 1024 * 1024) { // 10MB Limit
            return new Response("File too large (> 10MB)", { status: 413, headers: corsHeaders });
        }

        if (!file.type.startsWith("image/")) {
            return new Response("Invalid file type", { status: 415, headers: corsHeaders });
        }

        // Generate unique filename and use deviceId as folder
        const key = crypto.randomUUID();
        const extension = file.type.split("/")[1] || "bin";
        // To prevent directory traversal, clean deviceId slightly
        const safeDeviceId = deviceId.replace(/[^a-zA-Z0-9-]/g, '');
        const objectKey = `uploads/${safeDeviceId}/${key}.${extension}`;

        // Upload to R2
        if (!env.EVENT_PHOTOS_BUCKET) {
            console.error("Missing EVENT_PHOTOS_BUCKET binding");
            return new Response("Server Configuration Error", { status: 500, headers: corsHeaders });
        }

        const uploadResult = await env.EVENT_PHOTOS_BUCKET.put(objectKey, file, {
            customMetadata: {
                guestName,
                uploadedAt: new Date().toISOString()
            }
        });

        return new Response(JSON.stringify({
            success: true,
            key: objectKey,
            message: "Upload successful"
        }), {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });

    } catch (err) {
        console.error("Upload error:", err);
        return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
