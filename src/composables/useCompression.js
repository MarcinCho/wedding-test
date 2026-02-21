import imageCompression from 'browser-image-compression';
import { ref } from 'vue';

export function useCompression() {
    const isCompressing = ref(false);
    const error = ref(null);

    const compressImage = async (file) => {
        isCompressing.value = true;
        error.value = null;

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: 0.8,
        };

        try {
            const compressedFile = await imageCompression(file, options);
            return compressedFile;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Compression failed';
            console.error(err);
            return null;
        } finally {
            isCompressing.value = false;
        }
    };

    return { compressImage, isCompressing, error };
}
