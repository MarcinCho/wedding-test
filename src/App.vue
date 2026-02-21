<script setup>
import CountdownComp from "./components/CountdownComp.vue";
import ImageUploader from "./components/ImageUploader.vue";
import BasicInfo from "./components/BasicInfo.vue";
import RSVPForm from "./components/RSVPForm.vue";
</script>

<template>
  <div class="text-center items-center justify-center align-middle" v-if="true">
    <CountdownComp />
    <ImageUploader />
    <BasicInfo />
    <RSVPForm />
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
