import { getGoogleAuthToken } from './auth.js';

export async function onRequestPost({ request, env }) {
    try {
        const data = await request.formData();
        const guestName = data.get('guestName');
        const deviceId = data.get('deviceId');
        const mimeType = data.get('mimeType') || 'video/mp4';
        const fileName = data.get('fileName') || `video_${Date.now()}.mp4`;

        if (!guestName || !deviceId) {
            return new Response(JSON.stringify({ success: false, message: 'Missing metadata' }), { status: 400 });
        }
        if (!env.DRIVE_FOLDER_ID) {
            return new Response(JSON.stringify({ success: false, message: 'Google Drive configuration missing' }), { status: 500 });
        }

        const token = await getGoogleAuthToken(env);

        // Initial POST to start resumable session
        const metadata = {
            name: fileName,
            mimeType: mimeType,
            parents: [env.DRIVE_FOLDER_ID],
            appProperties: {
                deviceId: deviceId,
                guestName: guestName
            }
        };

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': mimeType
            },
            body: JSON.stringify(metadata)
        });

        if (res.status !== 200) {
            const errDetails = await res.text();
            console.error("Drive upload start error:", errDetails);
            throw new Error('Failed to initiate Google Drive upload');
        }

        const uploadUrl = res.headers.get('location');

        return new Response(JSON.stringify({
            success: true,
            uploadUrl: uploadUrl
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
