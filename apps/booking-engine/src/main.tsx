import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "@tripalfa/ui-components";
import { TenantThemeProvider } from "./components/providers/TenantThemeProvider";
import { TenantRuntimeProvider } from "./components/providers/TenantRuntimeProvider";

// Test mode setup
if (import.meta.env.VITE_TEST_MODE === "true") {
  console.log("🧪 Running in test mode - setting up mocks");
  import("./mocks/browser").then(({ worker }) => {
    worker.start({
      onUnhandledRequest: "bypass", // Allow unhandled requests to pass through
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
