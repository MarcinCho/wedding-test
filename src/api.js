export async function uploadImage(file, guestName, deviceId, onProgress) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);
        if (guestName) formData.append('guestName', guestName);
        if (deviceId) formData.append('deviceId', deviceId);

        // Use environment variable for API URL or default to local proxy/relative path
        const apiUrl = import.meta.env.VITE_API_URL || '/api/upload';
        xhr.open('POST', apiUrl);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                onProgress(Math.round(percentComplete));
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve({ success: true });
            } else {
                resolve({ success: false, message: xhr.responseText || 'Upload failed' });
            }
        };

        xhr.onerror = () => {
            resolve({ success: false, message: 'Network error' });
        };

        xhr.send(formData);
    });
}

export async function getDriveUploadUrl(file, guestName, deviceId) {
    const formData = new FormData();
    formData.append('guestName', guestName);
    formData.append('deviceId', deviceId);
    formData.append('mimeType', file.type);
    formData.append('fileName', file.name);

    const res = await fetch('/api/drive/upload-url', {
        method: 'POST',
        body: formData
    });
    return await res.json();
}

export async function uploadVideoToDrive(file, uploadUrl, onProgress) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                onProgress(Math.round(percentComplete));
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
                resolve({ success: true });
            } else {
                resolve({ success: false, message: xhr.responseText || 'Video upload failed' });
            }
        };

        xhr.onerror = () => {
            resolve({ success: false, message: 'Network error during video upload' });
        };

        xhr.send(file);
    });
}
