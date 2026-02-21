<template>
  <div
    class="pb-5bg-gray-100 p-6 rounded-lg shadow-md max-w-md mx-auto bg-linear-75 from-purple-100 to-pink-200"
  >
    <h2>Potwierdzenie Przybycia (RSVP) 🥂</h2>
    <form @submit.prevent="submitRSVP" class="rsvp-form">
      <div class="form-group">
        <label for="name">Imię i Nazwisko Gościa/Gości:</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          required
          placeholder="np. Anna i Jan Kowalscy"
        />
      </div>

      <div class="form-group">
        <label for="guests"
          >Liczba potwierdzanych gości (łącznie z Tobą):</label
        >
        <input
          id="guests"
          v-model.number="formData.guestCount"
          type="number"
          min="1"
          required
          placeholder="np. 2"
        />
      </div>

      <div class="form-group">
        <label for="comment">Komentarz / Uwagi (np. dieta, piosenka):</label>
        <textarea
          id="comment"
          v-model="formData.comment"
          rows="3"
          placeholder="Opcjonalny komentarz..."
        ></textarea>
      </div>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? "Wysyłanie..." : "Potwierdź Obecność" }}
      </button>
    </form>

    <p v-if="message" :class="isSuccess ? 'success' : 'error'">
      {{ message }}
    </p>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";

const formData = reactive({
  name: "",
  guestCount: 1,
  comment: "",
});

const isLoading = ref(false);
const message = ref("");
const isSuccess = ref(false);

const API_ENDPOINT = "/api/send-rsvp"; // Endpoint Cloudflare Worker

const submitRSVP = async () => {
  isLoading.value = true;
  message.value = "";
  isSuccess.value = false;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      isSuccess.value = true;
      message.value =
        "🥳 Dziękujemy! Twoje potwierdzenie zostało wysłane pomyślnie!";
      // Opcjonalnie: zresetowanie formularza
      formData.name = "";
      formData.guestCount = 1;
      formData.comment = "";
    } else {
      isSuccess.value = false;
      message.value = `Błąd: ${
        data.error || "Nie udało się wysłać potwierdzenia."
      }`;
    }
  } catch (error) {
    isSuccess.value = false;
    message.value = "Wystąpił błąd sieci. Spróbuj ponownie później.";
    console.error("Fetch error:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Dodaj ten CSS do komponentu lub do globalnego arkusza stylów */
.rsvp-container {
  max-width: 400px;
  margin: 40px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}
.rsvp-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #dbb5d679;
}
button {
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}
button:hover:not(:disabled) {
  background-color: #45a049;
}
button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}
.success {
  color: green;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid lightgreen;
  background-color: #e6ffe6;
  border-radius: 4px;
}
.error {
  color: red;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid lightcoral;
  background-color: #ffe6e6;
  border-radius: 4px;
}
</style>
