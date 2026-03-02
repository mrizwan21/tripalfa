import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const DEFAULT_TIMEOUT = 180_000; // 180 seconds for very large paginated requests
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createClient(
  baseURL: string,
  headers: Record<string, string>,
  timeout = DEFAULT_TIMEOUT,
): AxiosInstance {
  return axios.create({ baseURL, headers, timeout });
}

/** Retry-aware GET wrapper. Retries on 429 / 5xx. */
export async function get<T>(
  client: AxiosInstance,
  path: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      const resp = await client.get<T>(path, { params, ...config });
      return resp.data;
    } catch (err: unknown) {
      attempt++;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;

      if (
        attempt < MAX_RETRIES &&
        (status === 429 || (status !== undefined && status >= 500))
      ) {
        const delay = RETRY_DELAY_MS * attempt;
        console.warn(
          `[HTTP] ${status} on ${path} — retry ${attempt}/${MAX_RETRIES} in ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}

/** LiteAPI client */
export function createLiteApiClient(apiKey: string): AxiosInstance {
  return createClient("https://api.liteapi.travel/v3.0", {
    accept: "application/json",
    "X-API-Key": apiKey,
  });
}

/** Duffel client */
export function createDuffelClient(accessToken: string): AxiosInstance {
  return createClient("https://api.duffel.com", {
    Accept: "application/json",
    "Accept-Encoding": "gzip",
    "Duffel-Version": "v2",
    Authorization: `Bearer ${accessToken}`,
  });
}

/** OpenExchangeRates client */
export function createOERClient(appId: string): AxiosInstance {
  return createClient(
    "https://openexchangerates.org/api",
    {
      Accept: "application/json",
    },
    10_000,
  );
}
