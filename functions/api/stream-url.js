export async function onRequestPost({ request, env }) {
    try {
        const data = await request.formData();
        const guestName = data.get('guestName');
        const deviceId = data.get('deviceId');

        if (!guestName || !deviceId) {
            return new Response(JSON.stringify({ success: false, message: 'Missing metadata' }), { status: 400 });
        }

        if (!env.CF_ACCOUNT_ID || !env.CF_STREAM_API_TOKEN) {
            return new Response(JSON.stringify({ success: false, message: 'Cloudflare Stream API credentials are not configured in your environment.' }), { status: 500 });
        }

        // Call Cloudflare Stream API to get a Direct Creator Upload URL
        const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream?direct_user=true`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.CF_STREAM_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                maxDurationSeconds: 120, // max 2 minutes per clip
                creator: deviceId, // filter by this ID later
                meta: {
                    guestName: guestName,
                    deviceId: deviceId,
                }
            })
        });

        if (!response.ok) {
            const errDetails = await response.text();
            console.error("Stream API Error:", errDetails);
            throw new Error('Failed to get Stream upload URL');
        }

        const streamData = await response.json();

        // streamData.result.uploadURL is the pre-signed URL to POST the video to
        // streamData.result.uid is the video ID
        return new Response(JSON.stringify({
            success: true,
            uploadUrl: streamData.result.uploadURL,
            uid: streamData.result.uid
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
