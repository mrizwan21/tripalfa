/**
 * All Super Admin API traffic is centralized through the API Manager (Kong/Wicked).
 */
export const superAdminApiBaseUrl =
  import.meta.env.VITE_API_GATEWAY_URL ||
  "http://localhost:3030";

export const adminHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "x-admin-id": localStorage.getItem("adminId") || "superadmin",
});

export async function requestJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const mergedHeaders = {
    ...adminHeaders(),
    ...(opts?.headers || {}),
  };
  const res = await fetch(url, { ...opts, headers: mergedHeaders });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
