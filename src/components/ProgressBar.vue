<script setup>
defineProps({
  progress: Number
})
</script>

<template>
  <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
    <div 
      class="bg-blue-500 h-full transition-all duration-300 ease-out"
      :style="{ width: `${progress}%` }"
    ></div>
  </div>
  <p class="text-xs text-center mt-1 text-gray-400">{{ progress }}%</p>
</template>
