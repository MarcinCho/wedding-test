import { getGoogleAuthToken } from './auth.js';

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const deviceId = url.searchParams.get('deviceId');

        if (!deviceId) {
            return new Response(JSON.stringify({ success: false, message: 'Missing deviceId parameter' }), { status: 400 });
        }
        if (!env.DRIVE_FOLDER_ID) {
            return new Response(JSON.stringify({ success: false, message: 'Google Drive configuration missing' }), { status: 500 });
        }

        const token = await getGoogleAuthToken(env);

        const q = `'${env.DRIVE_FOLDER_ID}' in parents and appProperties has { key='deviceId' and value='${deviceId}' } and trashed = false`;
        const searchParams = new URLSearchParams({
            q: q,
            fields: 'files(id, name, thumbnailLink)',
            spaces: 'drive',
        });

        const res = await fetch(`https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const errDetails = await res.text();
            console.error("Drive API Error list videos:", errDetails);
            throw new Error('Failed to fetch videos from Drive');
        }

        const data = await res.json();
        const videos = data.files.map(file => ({
            uid: file.id,
            name: file.name,
            thumbnail: file.thumbnailLink // Contains a URL to a thumbnail
        }));

        return new Response(JSON.stringify({ success: true, videos }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
