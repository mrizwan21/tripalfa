import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "@tripalfa/ui-components";
import { TenantThemeProvider } from "./components/providers/TenantThemeProvider";
import { TenantRuntimeProvider } from "./components/providers/TenantRuntimeProvider";

// Enable MSW in development mode or test mode
const isDev = import.meta.env.DEV || import.meta.env.VITE_TEST_MODE === "true";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Function to render the app
function renderApp() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TenantRuntimeProvider>
          <TenantThemeProvider>
            <App />
          </TenantThemeProvider>
        </TenantRuntimeProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

if (isDev) {
  if (import.meta.env.VITE_TEST_MODE === "true") {
    console.log("🧪 Running in test mode - setting up mocks");
  }
  // Set MSW enabled flag for dataFetchStrategy detection
  if (typeof window !== 'undefined') {
    (window as any).__MSW_ENABLED__ = true;
  }
  // Initialize MSW and WAIT for it to complete before rendering the app
  import("./mocks/browser")
    .then(({ worker }) => {
      return worker.start({
        onUnhandledRequest: "bypass", // Allow unhandled requests to pass through
        quiet: false, // Show MSW logs for debugging
      });
    })
    .then(() => {
      console.log("✅ MSW initialized successfully");
      renderApp();
    })
    .catch((err) => {
      console.warn("MSW initialization failed, continuing without mocks:", err);
      renderApp(); // Still render the app even if MSW fails
    });
} else {
  // In production, render immediately
  renderApp();
}
