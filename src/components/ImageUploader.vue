<script setup>
import { ref, computed, onMounted } from 'vue';
import { uploadImage, getStreamUploadUrl, uploadVideoToStream } from '../api.js';
import ProgressBar from './ProgressBar.vue';

const guestName = ref('');
const deviceId = ref('');
const inputName = ref('');
const showNamePrompt = ref(true);

const myPhotos = ref([]);
const myVideos = ref([]);
const isFetchingPhotos = ref(false);
const showMyPhotos = ref(false);
const isManageMode = ref(false);

const selectedFiles = ref([]);
const isUploading = ref(false);
const globalUploadStatus = ref('idle');
const globalErrorMessage = ref('');
const streamCustomerId = import.meta.env.VITE_CF_STREAM_CUSTOMER_ID || 'yourid';

onMounted(() => {
  const storedName = localStorage.getItem('wedding_guestName');
  const storedDevice = localStorage.getItem('wedding_deviceId');
  if (storedName && storedDevice) {
    guestName.value = storedName;
    deviceId.value = storedDevice;
    showNamePrompt.value = false;
  }
});

const saveGuestName = () => {
  if (inputName.value.trim() === '') return;
  guestName.value = inputName.value.trim();
  deviceId.value = crypto.randomUUID();
  localStorage.setItem('wedding_guestName', guestName.value);
  localStorage.setItem('wedding_deviceId', deviceId.value);
  showNamePrompt.value = false;
};

const fetchMyPhotos = async () => {
  if (!deviceId.value) return;
  isFetchingPhotos.value = true;
  showMyPhotos.value = true;
  isManageMode.value = false;
  try {
    const [resPhotos, resVideos] = await Promise.all([
      fetch(`/api/my-photos?deviceId=${deviceId.value}`),
      fetch(`/api/my-videos?deviceId=${deviceId.value}`)
    ]);
    
    const dataPhotos = await resPhotos.json();
    if (dataPhotos.success && dataPhotos.photos) {
      myPhotos.value = dataPhotos.photos;
    }

    const dataVideos = await resVideos.json();
    if (dataVideos.success && dataVideos.videos) {
      myVideos.value = dataVideos.videos;
    }
  } catch (err) {
    console.error("Failed to fetch media", err);
  } finally {
    isFetchingPhotos.value = false;
  }
};

const deletePhoto = async (photoKey) => {
  if (!confirm("Are you sure you want to delete this photo forever?")) return;
  
  try {
    // Optimistic UI update
    myPhotos.value = myPhotos.value.filter(p => p.key !== photoKey);
    
    await fetch(`/api/delete?key=${encodeURIComponent(photoKey)}&deviceId=${encodeURIComponent(deviceId.value)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error("Failed to delete photo", err);
  }
};

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

  const newItems = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).map(file => {
    const isVideo = file.type.startsWith('video/');
    return {
      file,
      id: crypto.randomUUID(),
      previewUrl: isVideo ? null : URL.createObjectURL(file), // Video preview generates differently or just show an icon
      isVideo,
      progress: 0,
      status: 'idle', // 'idle', 'uploading', 'success', 'error'
      errorMessage: ''
    };
  });

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

     let result;
     if (fileItem.isVideo) {
         try {
             const streamData = await getStreamUploadUrl(guestName.value, deviceId.value);
             if (streamData.success && streamData.uploadUrl) {
                 result = await uploadVideoToStream(fileItem.file, streamData.uploadUrl, (progress) => {
                     fileItem.progress = progress;
                 });
             } else {
                 result = { success: false, message: streamData.message || 'Failed to get upload URL' };
             }
         } catch (e) {
             result = { success: false, message: e.message };
         }
     } else {
         result = await uploadImage(fileItem.file, guestName.value, deviceId.value, (progress) => {
            fileItem.progress = progress;
         });
     }

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
    
    
    <!-- Guest Name Prompt -->
    <div v-if="showNamePrompt" class="p-6 text-center">
      <h3 class="text-xl font-bold font-[Cinzel] text-gray-800 mb-2">Who is sharing these wonderful moments?</h3>
      <p class="text-sm text-gray-600 mb-4">Please enter your name so we know who to thank!</p>
      <input 
        v-model="inputName" 
        @keyup.enter="saveGuestName"
        type="text" 
        placeholder="Your Name (e.g. John & Jane)" 
        class="w-full p-3 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 mb-4 text-center"
      />
      <button 
        @click="saveGuestName"
        :disabled="inputName.trim() === ''"
        class="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors"
      >
        Continue
      </button>
    </div>

    <div v-else>
      <!-- Upload Area -->
      <div 
        v-if="globalUploadStatus !== 'success' && !isUploading"
      class="border-2 border-dashed border-pink-300 bg-[#dbb5d679] rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer relative mb-4"
      @dragover.prevent
      @drop="handleDrop"
    >
      <input 
        type="file" 
        accept="image/*,video/mp4,video/quicktime,video/webm" 
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
          <div v-else-if="fileItem.isVideo" class="w-full h-full bg-gray-800 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
               <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
             </svg>
          </div>
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

    <!-- View My Photos Button & Gallery -->
    <div v-if="!showNamePrompt" class="mt-8 border-t border-pink-200 pt-6">
      <button 
        v-if="!showMyPhotos"
        @click="fetchMyPhotos"
        class="text-pink-600 hover:text-pink-800 font-medium underline transition-colors"
      >
        View My Uploaded Photos
      </button>

      <div v-if="showMyPhotos" class="text-left">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-gray-800 font-[Cinzel]">My Uploaded Photos</h3>
          <div class="flex gap-4">
            <button v-if="myPhotos.length > 0" @click="isManageMode = !isManageMode" class="text-sm font-medium" :class="isManageMode ? 'text-pink-600' : 'text-gray-500 hover:text-gray-700'">
              {{ isManageMode ? 'Done' : 'Manage' }}
            </button>
            <button @click="showMyPhotos = false; isManageMode = false" class="text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
        </div>
        
        <div v-if="isFetchingPhotos" class="text-center py-4 text-gray-500">
          Loading your moments...
        </div>
        <div v-else-if="myPhotos.length === 0 && myVideos.length === 0" class="text-center py-4 text-gray-500 text-sm">
          You haven't uploaded any media yet.
        </div>
        <div v-else class="space-y-6">
          
          <div v-if="myPhotos.length > 0">
            <h4 class="font-semibold text-gray-700 mb-2">Photos</h4>
            <div class="grid grid-cols-3 gap-2">
              <div v-for="photo in myPhotos" :key="photo.key" class="relative group aspect-square rounded-lg overflow-hidden border border-pink-100 shadow-sm bg-gray-200">
                 <img :src="photo.url" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                 
                 <button 
                    v-if="isManageMode"
                    @click.stop="deletePhoto(photo.key)"
                    class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-transform active:scale-95"
                    title="Delete Photo"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                 </button>
              </div>
            </div>
          </div>

          <div v-if="myVideos.length > 0">
            <h4 class="font-semibold text-gray-700 mb-2">Videos</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div v-for="video in myVideos" :key="video.uid" class="relative group rounded-lg overflow-hidden border border-pink-100 shadow-sm bg-black">
                 <iframe 
                    v-if="video.status === 'ready'"
                    :src="`https://customer-${streamCustomerId}.cloudflarestream.com/${video.uid}/iframe?controls=true`"
                    class="w-full aspect-video"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
                    allowfullscreen
                 ></iframe>
                 <div v-else class="w-full aspect-video flex flex-col items-center justify-center text-white p-4 text-center">
                    <svg class="animate-spin h-8 w-8 text-pink-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                       <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-xs">Processing Video...</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
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
