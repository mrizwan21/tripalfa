import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// This configures a Service Worker with the given request handlers.
// The worker script is located at /public/mockServiceWorker.js
export const worker = setupWorker(...handlers);
