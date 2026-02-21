<template>
  <div>
    <div class="flex flex-col items-center justify-center text-center">
      <h2 class="font-cinzel text-3xl">Kochani!</h2>
      <h2 class="font-cinzel text-2xl mb-3">
        Mamy dla Was najważniejszą informację tego roku! ❤️
      </h2>
      <p
        class="font-amsterdam text-5xl pb-5bg-gray-100 p-6 rounded-lg shadow-md"
      >
        Ola i Marcin
      </p>
      <p class="font-cinzel text-2xl pt-6">Zapraszją na swój ślub</p>
      <p class="font-cinzel text-xl md:mb-4 text-center">
        Który Odbędzie się za
      </p>

      <div v-if="!isFinished" id="timer">
        <!-- Time units container -->

        <div class="time-box">
          <span id="days" class="time-value">{{
            days.toString().padStart(2, "0")
          }}</span
          ><span class="time-label">Dni</span>
          <span id="hours" class="time-value">{{
            hours.toString().padStart(2, "0")
          }}</span>
          <span class="time-label">godz.</span>
          <span id="minutes" class="time-value">{{
            minutes.toString().padStart(2, "0")
          }}</span>
          <span class="time-label">Min.</span>
        </div>
      </div>

      <div v-else>The countdown has finished!</div>
    </div>
  </div>
</template>

<script>
export default {
  // Component Name
  name: "Countdown",

  // Use a prop for the target date, making the component reusable.
  props: {
    targetDate: {
      type: String,
      required: true,
      default: "2026-09-12T16:00:00",
    },
  },

  data() {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isFinished: false,
      interval: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },

  mounted() {
    // Start the countdown timer when the component is mounted.
    this.interval = setInterval(this.updateCountdown, 1000);
    this.updateCountdown(); // Call once immediately to avoid a 1-second delay
  },

  beforeUnmount() {
    // Clear the interval when the component is destroyed to prevent memory leaks.
    clearInterval(this.interval);
  },

  methods: {
    updateCountdown() {
      const target = new Date(this.targetDate);
      const now = new Date();
      const difference = target.getTime() - now.getTime(); // Difference in milliseconds

      // Check if the countdown has finished.
      if (difference <= 0) {
        clearInterval(this.interval);
        this.isFinished = true;
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        return;
      }

      // Calculate time components
      const totalSeconds = Math.floor(difference / 1000);

      this.days = Math.floor(totalSeconds / (60 * 60 * 24));
      this.hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      this.minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      this.seconds = Math.floor(totalSeconds % 60);
    },
  },
};
</script>

<style scoped>
#timer {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 5px;
}
/* The large number (e.g., "05") */
.time-value {
  font-size: 2rem;
  font-weight: 700;
  color: #140712; /* A splash of color */
  line-height: 1.2;
}

/* The label (e.g., "Days") */
.time-label {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #121111;
  margin-top: 5px;
}

/* .time-box span {
  display: block;
} */

.time-box {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}
</style>

<!-- The <style scoped> block was removed -->
