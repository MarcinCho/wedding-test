export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const deviceId = url.searchParams.get('deviceId');

        if (!deviceId) {
            return new Response(JSON.stringify({ success: false, message: 'Missing deviceId parameter' }), { status: 400 });
        }

        if (!env.CF_ACCOUNT_ID || !env.CF_STREAM_API_TOKEN) {
            return new Response(JSON.stringify({ success: false, message: 'Cloudflare Stream API credentials are not configured.' }), { status: 500 });
        }

        // Search Stream for videos created by this deviceId
        const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream?creator=${deviceId}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.CF_STREAM_API_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errDetails = await response.text();
            console.error("Stream API Error fetch my-videos:", errDetails);
            throw new Error('Failed to fetch videos from Stream');
        }

        const data = await response.json();

        // Map videos
        const videos = data.result.map(video => ({
            uid: video.uid,
            preview: video.preview,
            thumbnail: video.thumbnail,
            playbackHls: video.playback.hls,
            playbackDash: video.playback.dash,
            status: video.status.state,
        }));

        return new Response(JSON.stringify({ success: true, videos }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
