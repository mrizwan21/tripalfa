/**
 * Base API client for making HTTP requests.
 * 
 * This module is intentionally kept separate from api.ts to avoid circular dependencies.
 * Service files (duffelApiManager, seatMapsApi, etc.) should import from this file,
 * not from api.ts which re-exports from those services.
 */

import { API_BASE_URL } from "./constants";

// Safe logging helpers to avoid console spam in production
const safeLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") console.log(...args);
};
const safeWarn = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") console.warn(...args);
};
const safeError = (...args: unknown[]) => {
  console.error(...args);
};

/**
 * Fetch data from the API with timeout and error handling.
 */
async function remoteFetch(
  path: string,
  options: { method: string; body?: string } = { method: "GET" },
): Promise<any> {
  const url = `${API_BASE_URL}${path}`;
  const timeout = 15000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), timeout);

    safeLog(`[apiClient] ${options.method} ${url}`);

    const response = await fetch(url, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: options.body,
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const error = new Error(
        `API ${response.status} ${response.statusText} for ${path}`,
      ) as Error & { status?: number; body?: string };
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    safeError(`[apiClient] Exception:`, {
      message: error?.message,
      name: error?.name,
    });
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Real API client object - provides get, post, put, patch, delete methods.
 */
export const api = {
  async get<T = any>(path: string): Promise<T> {
    return await remoteFetch(path, { method: "GET" });
  },
  async post<T = any>(path: string, data?: unknown): Promise<T> {
    return await remoteFetch(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  async put<T = any>(path: string, data?: unknown): Promise<T> {
    return await remoteFetch(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  async patch<T = any>(path: string, data?: unknown): Promise<T> {
    return await remoteFetch(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  async delete<T = any>(path: string): Promise<T> {
    return await remoteFetch(path, { method: "DELETE" });
  },
};
