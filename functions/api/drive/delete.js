import { getGoogleAuthToken } from './auth.js';

export async function onRequestDelete({ request, env }) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const deviceId = url.searchParams.get('deviceId');

        if (!id || !deviceId) {
            return new Response(JSON.stringify({ success: false, message: 'Missing parameters' }), { status: 400 });
        }

        const token = await getGoogleAuthToken(env);

        // Verify it belongs to deviceId first
        const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=appProperties`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!getRes.ok) throw new Error("Failed to verify file permissions");

        const getProps = await getRes.json();
        if (!getProps.appProperties || getProps.appProperties.deviceId !== deviceId) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 403 });
        }

        // Delete it
        const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!delRes.ok) {
            const errDetails = await delRes.text();
            console.error("Drive API Error delete video:", errDetails);
            throw new Error('Failed to delete video from Drive');
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
