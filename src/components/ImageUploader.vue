<script setup>
import { ref } from 'vue';
import { useCompression } from '../composables/useCompression.js';
import { uploadImage } from '../api.js';
import ProgressBar from './ProgressBar.vue';

const { compressImage, isCompressing } = useCompression();

const selectedFile = ref(null);
const previewUrl = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref('idle');
const errorMessage = ref('');

const handleFileSelect = async (event) => {
  const target = event.target;
  if (target.files && target.files[0]) {
    await processFile(target.files[0]);
  }
};

const handleDrop = async (event) => {
  event.preventDefault();
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    await processFile(event.dataTransfer.files[0]);
  }
};

const processFile = async (file) => {
  resetState();
  
  // Create initial preview
  previewUrl.value = URL.createObjectURL(file);
  
  // Compress
  const compressed = await compressImage(file);
  if (compressed) {
    selectedFile.value = compressed;
    // Update preview with compressed version to show what will be uploaded (optional, but good for verification)
    // URL.revokeObjectURL(previewUrl.value!);
    // previewUrl.value = URL.createObjectURL(compressed);
  } else {
    errorMessage.value = "Failed to compress image.";
    uploadStatus.value = 'error';
  }
};

const upload = async () => {
  if (!selectedFile.value) return;
  
  isUploading.value = true;
  uploadProgress.value = 0;
  uploadStatus.value = 'idle';
  
  const result = await uploadImage(selectedFile.value, (progress) => {
    uploadProgress.value = progress;
  });
  
  if (result.success) {
    uploadStatus.value = 'success';
    selectedFile.value = null;
    previewUrl.value = null;
  } else {
    uploadStatus.value = 'error';
    errorMessage.value = result.message || 'Upload failed.';
  }
  
  isUploading.value = false;
};

const resetState = () => {
  selectedFile.value = null;
  previewUrl.value = null;
  uploadProgress.value = 0;
  uploadStatus.value = 'idle';
  errorMessage.value = '';
};
</script>

<template>
  <div class="w-full max-w-md mx-auto p-4 bg-gray-100 bg-linear-75 from-purple-100 to-pink-200 rounded-lg shadow-xl">
    
    <!-- Upload Area -->
    <div 
      v-if="!selectedFile && uploadStatus !== 'success'"
      class="border-2 border-dashed border-pink-300 bg-[#dbb5d679] rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer relative"
      @dragover.prevent
      @drop="handleDrop"
    >
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        @change="handleFileSelect"
      />
      <div class="space-y-2 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-gray-700 font-bold">Tap to take photo</p>
        <p class="text-gray-600 text-sm">or drag and drop</p>
      </div>
    </div>

    <!-- Processing State -->
    <div v-if="isCompressing" class="text-center p-8">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4caf50] mx-auto mb-4"></div>
      <p class="text-gray-700 font-medium">Compressing image...</p>
    </div>

    <!-- Preview & Action Area -->
    <div v-if="selectedFile && !isCompressing" class="space-y-4">
      <div class="relative rounded-lg overflow-hidden aspect-[4/3] bg-black">
        <img :src="previewUrl || ''" class="w-full h-full object-contain" />
        <button 
          @click="resetState"
          class="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div v-if="isUploading">
          <ProgressBar :progress="uploadProgress" />
          <p class="text-center text-sm text-gray-600 mt-2 font-medium">Uploading...</p>
        </div>

        <button 
          v-else
          @click="upload"
          class="w-full bg-[#4caf50] hover:bg-[#45a049] text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          Upload Photo
        </button>
      </div>
      
      <p v-if="errorMessage" class="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Success State -->
    <div v-if="uploadStatus === 'success'" class="text-center p-8 space-y-4">
      <div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100/50 text-[#4caf50] mb-2 border-2 border-[#4caf50]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-800">Upload Successful!</h3>
      <p class="text-gray-600">Your photo has been safely stored.</p>
      <button 
        @click="resetState" 
        class="mt-4 text-[#4caf50] hover:text-[#45a049] font-medium hover:underline"
      >
        Upload another photo
      </button>
    </div>

  </div>
</template>
