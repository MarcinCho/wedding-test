<script setup>
import { ref, computed } from 'vue';
import { uploadImage } from '../api.js';
import ProgressBar from './ProgressBar.vue';

const selectedFiles = ref([]);
const isUploading = ref(false);
const globalUploadStatus = ref('idle');
const globalErrorMessage = ref('');

const handleFileSelect = (event) => {
  const target = event.target;
  if (target.files && target.files.length > 0) {
    processFiles(Array.from(target.files));
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    processFiles(Array.from(event.dataTransfer.files));
  }
};

const processFiles = (files) => {
  // reset global status if we are adding new files after a success/error
  if (globalUploadStatus.value === 'success' || globalUploadStatus.value === 'error') {
     globalUploadStatus.value = 'idle';
     globalErrorMessage.value = '';
     if (globalUploadStatus.value === 'success') {
         selectedFiles.value = [];
     }
  }

  const newItems = files.filter(f => f.type.startsWith('image/')).map(file => ({
    file,
    id: crypto.randomUUID(),
    previewUrl: URL.createObjectURL(file),
    progress: 0,
    status: 'idle', // 'idle', 'uploading', 'success', 'error'
    errorMessage: ''
  }));

  selectedFiles.value = [...selectedFiles.value, ...newItems];
};

const removeFile = (id) => {
  const fileToRemove = selectedFiles.value.find(f => f.id === id);
  if (fileToRemove) {
     URL.revokeObjectURL(fileToRemove.previewUrl);
     selectedFiles.value = selectedFiles.value.filter(f => f.id !== id);
  }
};

const totalProgress = computed(() => {
   if (selectedFiles.value.length === 0) return 0;
   const sum = selectedFiles.value.reduce((acc, curr) => acc + curr.progress, 0);
   return Math.round(sum / selectedFiles.value.length);
});

const upload = async () => {
  if (selectedFiles.value.length === 0) return;
  
  isUploading.value = true;
  globalUploadStatus.value = 'idle';
  globalErrorMessage.value = '';
  
  const filesToUpload = selectedFiles.value.filter(f => f.status !== 'success');

  for (const fileItem of filesToUpload) {
     fileItem.status = 'uploading';
     fileItem.progress = 0;

     const result = await uploadImage(fileItem.file, (progress) => {
        fileItem.progress = progress;
     });

     if (result.success) {
        fileItem.status = 'success';
        fileItem.progress = 100;
        // Revoke the object URL immediately to free memory on mobile browsers.
        // We will no longer show the thumbnail in the success state.
        if (fileItem.previewUrl) {
            URL.revokeObjectURL(fileItem.previewUrl);
            fileItem.previewUrl = null;
        }
     } else {
        fileItem.status = 'error';
        fileItem.errorMessage = result.message || 'Upload failed.';
     }
  }

  const hasErrors = selectedFiles.value.some(f => f.status === 'error');
  
  if (hasErrors) {
     globalUploadStatus.value = 'error';
     globalErrorMessage.value = 'Some files failed to upload.';
  } else {
     globalUploadStatus.value = 'success';
  }

  isUploading.value = false;
};

const resetState = () => {
  selectedFiles.value.forEach(f => {
    if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
  });
  selectedFiles.value = [];
  isUploading.value = false;
  globalUploadStatus.value = 'idle';
  globalErrorMessage.value = '';
};
</script>

<template>
  <div class="w-full max-w-md mx-auto p-4 bg-gray-100 bg-linear-75 from-purple-100 to-pink-200 rounded-lg shadow-xl">
    
    <!-- Upload Area -->
    <div 
      v-if="globalUploadStatus !== 'success' && !isUploading"
      class="border-2 border-dashed border-pink-300 bg-[#dbb5d679] rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer relative mb-4"
      @dragover.prevent
      @drop="handleDrop"
    >
      <input 
        type="file" 
        accept="image/*" 
        multiple
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        @change="handleFileSelect"
      />
      <div class="space-y-2 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-gray-700 font-bold">Tap to choose photos</p>
        <p class="text-gray-600 text-sm">or drag and drop multiple</p>
      </div>
    </div>

    <!-- Preview & Action Area -->
    <div v-if="selectedFiles.length > 0 && globalUploadStatus !== 'success'" class="space-y-4">
      
      <!-- Grid of Previews -->
      <div class="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1 custom-scrollbar">
        <div 
           v-for="fileItem in selectedFiles" 
           :key="fileItem.id"
           class="relative rounded-lg overflow-hidden aspect-square border border-pink-200 shadow-sm"
        >
          <img v-if="fileItem.previewUrl" :src="fileItem.previewUrl" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full bg-gray-200"></div>
          
          <button 
            v-if="!isUploading"
            @click="removeFile(fileItem.id)"
            class="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 z-10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <!-- Individual Status Overlay -->
          <div v-if="fileItem.status === 'uploading'" class="absolute inset-0 bg-black/50 flex items-center justify-center flex-col">
             <span class="text-white text-xs font-bold">{{ fileItem.progress }}%</span>
             <div class="w-3/4 bg-gray-600 h-1 mt-1 rounded overflow-hidden">
               <div class="bg-pink-400 h-full rounded" :style="{width: fileItem.progress + '%'}"></div>
             </div>
          </div>
          <div v-else-if="fileItem.status === 'success'" class="absolute inset-0 bg-green-500/50 flex items-center justify-center">
             <svg class="h-8 w-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
             </svg>
          </div>
          <div v-else-if="fileItem.status === 'error'" class="absolute inset-0 bg-red-500/60 flex items-center justify-center group" :title="fileItem.errorMessage">
             <svg class="h-8 w-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
             </svg>
          </div>
        </div>
      </div>

      <div class="space-y-4 pt-2">
        <div v-if="isUploading">
          <ProgressBar :progress="totalProgress" />
          <p class="text-center text-sm text-gray-600 mt-2 font-medium">Uploading {{ selectedFiles.length }} photo(s)...</p>
        </div>

        <button 
          v-else
          @click="upload"
          class="w-full bg-[#4caf50] hover:bg-[#45a049] text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          Upload {{ selectedFiles.length }} Photo(s)
        </button>
      </div>
      
      <p v-if="globalErrorMessage" class="text-red-500 text-sm text-center bg-red-100/50 p-2 rounded">
        {{ globalErrorMessage }}
      </p>
    </div>

    <!-- Success State -->
    <div v-if="globalUploadStatus === 'success'" class="text-center p-8 space-y-4">
      <div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100/50 text-[#4caf50] mb-2 border-2 border-[#4caf50]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-800">Upload Successful!</h3>
      <p class="text-gray-600">Your {{ selectedFiles.length }} photo(s) have been securely saved.</p>
      
      <!-- Previews are removed to save memory, display a count instead -->
      <div class="mb-4">
        <p class="text-gray-500 italic">Memory successfully freed</p>
      </div>

      <button 
        @click="resetState" 
        class="mt-4 text-[#4caf50] hover:text-[#45a049] font-medium hover:underline text-lg"
      >
        Upload more photos
      </button>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
</style>
