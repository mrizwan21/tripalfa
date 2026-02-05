import fs from 'fs';

export const stripeKey = fs.readFileSync('../../../../secrets/stripe_secret_key.txt', 'utf-8').trim();
export const duffelSandbox = {
  apiKey: process.env.DUFFEL_SANDBOX_KEY || 'duffel_test_key',
  endpoint: 'https://api.duffel.com/test',
};
export const hotelstonSandbox = {
  apiKey: process.env.HOTELSTON_SANDBOX_KEY || 'hotelston_test_key',
  endpoint: 'https://api.hotelston.com/sandbox',
};
export const liteApiSandbox = {
  apiKey: process.env.LITEAPI_SANDBOX_KEY || 'liteapi_test_key',
  endpoint: 'https://sandbox.liteapi.com',
};

export function mockExternalFailure(service: string) {
  // Implement mock for external service failure
}

export async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
