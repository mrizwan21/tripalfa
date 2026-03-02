import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { AccessControlProvider } from "@/contexts/AccessControlContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AccessControlProvider>
          <ThemeProvider defaultTheme="system">
            <App />
          </ThemeProvider>
        </AccessControlProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
