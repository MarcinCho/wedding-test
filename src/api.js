export async function uploadImage(file, onProgress) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

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
