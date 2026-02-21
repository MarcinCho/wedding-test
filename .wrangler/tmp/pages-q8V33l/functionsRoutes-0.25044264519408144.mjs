import { onRequestPost as __api_send_rsvp_js_onRequestPost } from "/home/main/Documents/DEV_Projects/Wedding_SPA_dev/Wedding_SPA_v2/functions/api/send-rsvp.js"
import { onRequestOptions as __api_upload_js_onRequestOptions } from "/home/main/Documents/DEV_Projects/Wedding_SPA_dev/Wedding_SPA_v2/functions/api/upload.js"
import { onRequestPost as __api_upload_js_onRequestPost } from "/home/main/Documents/DEV_Projects/Wedding_SPA_dev/Wedding_SPA_v2/functions/api/upload.js"

export const routes = [
    {
      routePath: "/api/send-rsvp",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_send_rsvp_js_onRequestPost],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_upload_js_onRequestOptions],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_js_onRequestPost],
    },
  ]