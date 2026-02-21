<script setup>
import { ref, computed } from 'vue';
import CountdownComp from "./components/CountdownComp.vue";
import ImageUploader from "./components/ImageUploader.vue";
import BasicInfo from "./components/BasicInfo.vue";
import RSVPForm from "./components/RSVPForm.vue";

// Define the target date for when the photo upload should be active.
// Replace this with the actual date! Example: '2026-06-15T00:00:00'
const TARGET_DATE = new Date('2026-02-20T00:00:00');

// Determine if we are past the target date
const isAfterTargetDate = computed(() => {
  return new Date() >= TARGET_DATE;
});

// State to toggle older content when we are past the target date
const showCountdown = ref(false);
const showBasicInfo = ref(false);
const showRSVPForm = ref(false);
</script>

<template>
  <div class="text-center items-center justify-center align-middle" v-if="true">
    
    <!-- Photo Upload Section (Only visible after the target date) -->
    <div v-if="isAfterTargetDate">
      <div class="py-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-4 font-[Cinzel]">Capture the Magic</h2>
        <p class="text-gray-600 mb-6">Help us remember our special day by sharing your photos!</p>
        <ImageUploader />
      </div>

      <!-- Toggle Buttons for previous content -->
      <div class="py-6 px-4">
        <h3 class="text-lg font-medium text-gray-700 mb-4">Looking for something else?</h3>
        <div class="flex flex-wrap justify-center gap-3">
          <button 
            @click="showCountdown = !showCountdown"
            class="px-4 py-2 rounded-full border border-pink-300 text-pink-700 hover:bg-pink-50 transition-colors text-sm font-medium"
            :class="{ 'bg-pink-100 border-pink-400': showCountdown }"
          >
            {{ showCountdown ? 'Hide Countdown' : 'View Countdown' }}
          </button>
          <button 
            @click="showBasicInfo = !showBasicInfo"
            class="px-4 py-2 rounded-full border border-pink-300 text-pink-700 hover:bg-pink-50 transition-colors text-sm font-medium"
            :class="{ 'bg-pink-100 border-pink-400': showBasicInfo }"
          >
            {{ showBasicInfo ? 'Hide Info' : 'View Info' }}
          </button>
          <button 
            @click="showRSVPForm = !showRSVPForm"
            class="px-4 py-2 rounded-full border border-pink-300 text-pink-700 hover:bg-pink-50 transition-colors text-sm font-medium"
            :class="{ 'bg-pink-100 border-pink-400': showRSVPForm }"
          >
            {{ showRSVPForm ? 'Hide RSVP' : 'View RSVP' }}
          </button>
        </div>
      </div>
      <hr class="my-4 border-gray-200" />
    </div>

    <!-- Original Content Sections -->
    <div v-show="!isAfterTargetDate || showCountdown">
      <CountdownComp />
    </div>
    
    <div v-if="!isAfterTargetDate" class="hidden">
      <!-- We don't want ImageUploader here anymore, it's moved to the isAfterTargetDate block -->
    </div>
    
    <div v-show="!isAfterTargetDate || showBasicInfo">
      <BasicInfo />
    </div>
    
    <div v-show="!isAfterTargetDate || showRSVPForm">
      <RSVPForm />
    </div>

    <p class="flex justify-center p-5">
      <img
        class=""
        src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OW4ybWxvYmR3bm51ZjhqcWFocGJ3aXd0d25oZ3JzaDNidm9reDQ5dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Zap6W7a0uSBGHmzdNA/giphy.gif"
        alt=""
      />
    </p>
    <hr />
    <p>Made with 🩷 by 🥟</p>
    <hr class="pb-5" />
  </div>
</template>

<style scoped></style>
