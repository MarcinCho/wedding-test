import { createApp } from "vue";
import App from "./App.vue"; // Import the main root component
import "./style.css"; // Import global styles
import CountdownComp from "./components/CountdownComp.vue";
import BasicInfo from "./components/BasicInfo.vue";
import RSVPForm from "./components/RSVPForm.vue";

const app = createApp(App);

app.component("CountdownComp", CountdownComp);
app.component("BasicInfo", BasicInfo);
app.component("RSVPForm", RSVPForm);
app.mount("#app");
