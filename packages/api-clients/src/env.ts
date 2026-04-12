/**
 * Typed Environment Configuration Utility
 *
 * Provides type-safe access to Vite environment variables
 * with proper fallback handling for browser builds.
 *
 * ⚠️ SECURITY WARNING: This interface only includes PUBLIC environment variables
 * that are safe to expose in the browser. Variables with the VITE_ prefix in Vite
 * are embedded in the client bundle and visible to users.
 *
 * NEVER add secret keys here (API secrets, private keys, passwords, etc.).
 * Server-side secrets should only be accessed via process.env in Node.js environments.
 */

// Extend ImportMeta to include Vite's env
declare global {
  interface ImportMeta {
    readonly env?: Record<string, string | undefined>;
  }
}

// Define the expected environment variable interface
// ONLY PUBLIC KEYS - These are embedded in the browser bundle
interface ImportMetaEnv {
  // Service URLs (Public - Safe)
  readonly VITE_AUDIT_SERVICE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ORGANIZATION_SERVICE_URL?: string;
  readonly VITE_API_GATEWAY_URL?: string;
  readonly VITE_NOTIFICATION_SERVICE_URL?: string;
  readonly VITE_PAYMENT_SERVICE_URL?: string;
  readonly VITE_RULE_ENGINE_SERVICE_URL?: string;
  readonly VITE_SUPPORT_SERVICE_URL?: string;
  readonly VITE_TAX_SERVICE_URL?: string;
  readonly VITE_KYC_SERVICE_URL?: string;
  readonly VITE_MARKETING_SERVICE_URL?: string;
  readonly VITE_WALLET_SERVICE_URL?: string;
  readonly VITE_INVENTORY_SERVICE_URL?: string;
  readonly VITE_PRICING_SERVICE_URL?: string;
  readonly VITE_REPORTING_SERVICE_URL?: string;
  readonly VITE_ANALYTICS_SERVICE_URL?: string;
  readonly VITE_SEARCH_SERVICE_URL?: string;
  readonly VITE_BOOKING_SERVICE_URL?: string;
  readonly VITE_USER_SERVICE_URL?: string;
  readonly VITE_AUTH_SERVICE_URL?: string;
  readonly VITE_RATE_LIMITER_SERVICE_URL?: string;
  readonly VITE_CACHE_SERVICE_URL?: string;
  readonly VITE_MESSAGE_QUEUE_URL?: string;
  readonly VITE_EVENT_BUS_URL?: string;
  readonly VITE_FILE_STORAGE_URL?: string;
  readonly VITE_EMAIL_SERVICE_URL?: string;
  readonly VITE_SMS_SERVICE_URL?: string;
  readonly VITE_PUSH_NOTIFICATION_URL?: string;
  readonly VITE_WEBSOCKET_URL?: string;
  readonly VITE_GRAPHQL_URL?: string;
  readonly VITE_REST_API_URL?: string;
  readonly VITE_GRPC_URL?: string;

  // API Configuration (Public - Safe)
  readonly VITE_API_VERSION?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_API_RETRY_ATTEMPTS?: string;
  readonly VITE_API_RETRY_DELAY?: string;
  readonly VITE_ENABLE_MOCK_API?: string;
  readonly VITE_ENABLE_DEBUG_LOGGING?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_ERROR_REPORTING?: string;

  // Application Info (Public - Safe)
  readonly VITE_APP_ENV?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BUILD_TIMESTAMP?: string;
  readonly VITE_GIT_COMMIT_SHA?: string;

  // Public API Keys (These are meant to be public/restricted)
  readonly VITE_STRIPE_PUBLIC_KEY?: string; // Publishable key only - NOT the secret key
  readonly VITE_PAYPAL_CLIENT_ID?: string; // Client ID only - NOT the secret
  readonly VITE_GOOGLE_MAPS_API_KEY?: string; // Restricted by domain
  readonly VITE_GOOGLE_ANALYTICS_ID?: string; // Measurement ID only
  readonly VITE_SENTRY_DSN?: string; // DSN is public by design
  readonly VITE_FACEBOOK_PIXEL_ID?: string;
  readonly VITE_HOTJAR_ID?: string;
  readonly VITE_INTERCOM_APP_ID?: string;
  readonly VITE_ZENDESK_CHAT_KEY?: string;
  readonly VITE_CRISP_WEBSITE_ID?: string;
  readonly VITE_TAWKTO_PROPERTY_ID?: string;
  readonly VITE_LIVECHAT_LICENSE_ID?: string;
  readonly VITE_DRIFT_ORG_ID?: string;
  readonly VITE_HUBSPOT_PORTAL_ID?: string;

  // Firebase Config (Public - Safe for client-side)
  readonly VITE_FIREBASE_API_KEY?: string; // API key is public with domain restrictions
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;

  // Public Identifiers (Safe)
  readonly VITE_TWILIO_ACCOUNT_SID?: string; // Account SID is public
  readonly VITE_AWS_REGION?: string;
  readonly VITE_AWS_S3_BUCKET?: string;
  readonly VITE_AWS_CLOUDFRONT_URL?: string;
  readonly VITE_AZURE_STORAGE_ACCOUNT?: string;
  readonly VITE_GCP_PROJECT_ID?: string;
  readonly VITE_GCP_STORAGE_BUCKET?: string;
  readonly VITE_ALGOLIA_APP_ID?: string; // App ID is public
  readonly VITE_ELASTICSEARCH_URL?: string;
  readonly VITE_PUSHER_APP_ID?: string;
  readonly VITE_PUSHER_KEY?: string; // Key is public
  readonly VITE_PUSHER_CLUSTER?: string;
  readonly VITE_PUBNUB_PUBLISH_KEY?: string; // Publish key is public
  readonly VITE_PUBNUB_SUBSCRIBE_KEY?: string;
  readonly VITE_STREAM_API_KEY?: string;
  readonly VITE_SANITY_PROJECT_ID?: string;
  readonly VITE_SANITY_DATASET?: string;
  readonly VITE_CONTENTFUL_SPACE_ID?: string;
  readonly VITE_PRISMIC_REPOSITORY_NAME?: string;
  readonly VITE_WORDPRESS_API_URL?: string;
  readonly VITE_DRUPAL_API_URL?: string;
  readonly VITE_STRAPI_API_URL?: string;
  readonly VITE_DIRECTUS_API_URL?: string;
  readonly VITE_PAYLOAD_CMS_API_URL?: string;
  readonly VITE_KEYSTONE_API_URL?: string;
  readonly VITE_GHOST_API_URL?: string;
  readonly VITE_NETLIFY_CMS_API_URL?: string;
  readonly VITE_DECAP_CMS_API_URL?: string;
  readonly VITE_TINA_CMS_API_URL?: string;
  readonly VITE_SQUIDEX_APP_NAME?: string;
  readonly VITE_SQUIDEX_CLIENT_ID?: string; // Client ID is public
  readonly VITE_BUTTER_CMS_API_KEY?: string; // Public read-only key
  readonly VITE_COSMIC_BUCKET_SLUG?: string;
  readonly VITE_GRAPHCMS_ENDPOINT?: string;
  readonly VITE_CRAFT_CMS_API_URL?: string;
  readonly VITE_COCKPIT_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string; // Anon key is public by design
  readonly VITE_APPWRITE_ENDPOINT?: string;
  readonly VITE_APPWRITE_PROJECT?: string;
  readonly VITE_POCKETBASE_URL?: string;
  readonly VITE_NHOST_SUBDOMAIN?: string;
  readonly VITE_NHOST_REGION?: string;
  readonly VITE_CONVEX_DEPLOYMENT_URL?: string;
  readonly VITE_CONVEX_SITE_URL?: string;
  readonly VITE_XATA_BRANCH?: string;
  readonly VITE_PLANETSCALE_HOST?: string;
  readonly VITE_PLANETSCALE_USERNAME?: string;
  readonly VITE_UPSTASH_REDIS_REST_URL?: string;
  readonly VITE_VERCEL_KV_URL?: string;
  readonly VITE_VERCEL_KV_REST_API_URL?: string;
  readonly VITE_VERCEL_POSTGRES_URL?: string;
  readonly VITE_VERCEL_POSTGRES_URL_NON_POOLING?: string;
  readonly VITE_VERCEL_POSTGRES_USER?: string;
  readonly VITE_VERCEL_POSTGRES_HOST?: string;
  readonly VITE_VERCEL_POSTGRES_DATABASE?: string;
}

/**
 * Get an environment variable with type safety and fallback
 * @param key - The environment variable key
 * @param fallback - Default value if env var is not set
 * @param options - Optional configuration
 * @param options.allowEmpty - If true, empty strings are considered valid values (default: false)
 * @returns The environment variable value or fallback
 */
export function getEnv<K extends keyof ImportMetaEnv>(
  key: K,
  fallback: string,
  options: { allowEmpty?: boolean } = {}
): string {
  // In Vite environments, import.meta.env is available at build time
  // In Node.js environments, process.env is available
  // This function handles both gracefully

  // Try import.meta.env first (Vite browser environment)
  // Note: import.meta.env must be accessed directly, not through variables
  const viteEnv = typeof import.meta !== "undefined" && import.meta.env;
  const viteValue = viteEnv ? viteEnv[key] : undefined;

  // Fallback to process.env (Node.js environment)
  const nodeValue = typeof process !== "undefined" ? process.env[key] : undefined;

  // Get the raw value (undefined if not set)
  const rawValue = (viteValue as string | undefined) ?? nodeValue;

  // If not set at all, return fallback
  if (rawValue === undefined) {
    return fallback;
  }

  // If empty string and not allowed, return fallback
  if (rawValue === "" && !options.allowEmpty) {
    return fallback;
  }

  return rawValue;
}

/**
 * Get an environment variable as a number
 * @param key - The environment variable key
 * @param fallback - Default numeric value if env var is not set or invalid
 * @returns The parsed number or fallback
 */
function getEnvNumber<K extends keyof ImportMetaEnv>(
  key: K,
  fallback: number
): number {
  const value = getEnv(key, String(fallback));
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Get an environment variable as a boolean
 * @param key - The environment variable key
 * @param fallback - Default boolean value if env var is not set
 * @returns true if value is 'true', '1', or 'yes' (case insensitive), false otherwise
 */
function getEnvBoolean<K extends keyof ImportMetaEnv>(
  key: K,
  fallback: boolean
): boolean {
  const value = getEnv(key, String(fallback));
  const normalized = value.toLowerCase().trim();
  return ["true", "1", "yes", "on", "enabled"].includes(normalized);
}

/**
 * Check if running in a Vite/browser environment
 */
function isViteEnvironment(): boolean {
  // import.meta.env is only available in ESM modules built by Vite
  return typeof import.meta !== "undefined" && !!import.meta.env;
}

/**
 * Check if running in a Node.js environment
 */
function isNodeEnvironment(): boolean {
  return (
    typeof process !== "undefined" &&
    !!process.env &&
    typeof import.meta === "undefined"
  );
}

/**
 * Custom error class for environment variable errors
 * Allows programmatic detection of env-related errors
 */
class EnvironmentVariableError extends Error {
  constructor(
    message: string,
    public readonly variableName?: string,
  ) {
    super(message);
    this.name = "EnvironmentVariableError";
  }
}

/**
 * Helper to ensure server-side env vars are only accessed in Node.js environment
 * @throws EnvironmentVariableError if called in browser environment
 */
function ensureServerEnvironment(): void {
  // Check for actual Node.js environment with process.versions.node
  // This is more reliable than checking for window absence (SSR, Electron, etc.)
  const isNode = typeof process !== "undefined" && 
                 !!process.versions?.node &&
                 typeof process.env === "object";

  // Detect browser-like environments (including Electron renderer, jsdom, etc.)
  // window.document is only present in real browsers, not Node.js
  const hasBrowserDocument = typeof window !== "undefined" && 
                              typeof window?.document !== "undefined";

  // Detect Electron renderer process (has both window and process, but process.type === 'renderer')
  const isElectronRenderer = typeof process !== "undefined" && 
                              (process as any).type === "renderer";

  if (hasBrowserDocument || isElectronRenderer || !isNode) {
    throw new EnvironmentVariableError(
      "Server-side environment variables cannot be accessed in this environment. " +
        "These secrets should only be used in Node.js server contexts. " +
        "If you need this value in the browser, check your architecture - " +
        "secrets should never be exposed to clients.",
      undefined
    );
  }
}

/**
 * Helper to get a required server-side environment variable
 * @throws EnvironmentVariableError if the environment variable is not set
 */
function getRequiredServerEnv(name: string): string {
  ensureServerEnvironment();
  const value = process.env[name];
  if (!value) {
    throw new EnvironmentVariableError(
      `Required environment variable "${name}" is not set. ` +
        "Please configure this in your environment or .env file.",
      name,
    );
  }
  return value;
}

/**
 * Server-side environment variables
 * These are NOT available in the browser and must only be accessed in Node.js code
 * Use these for API secrets, database URLs, private keys, etc.
 *
 * ⚠️ SECURITY: Each getter includes a runtime check to prevent accidental browser access.
 * If accessed from browser code, it will throw an error to prevent secret exposure.
 *
 * NOTE: These getters throw an error if the environment variable is not set.
 * This prevents silent failures. Use ServerEnvOptional for optional secrets.
 */
const ServerEnv = {
  // Stripe
  get STRIPE_SECRET_KEY(): string {
    return getRequiredServerEnv("STRIPE_SECRET_KEY");
  },
  get STRIPE_WEBHOOK_SECRET(): string {
    return getRequiredServerEnv("STRIPE_WEBHOOK_SECRET");
  },

  // PayPal
  get PAYPAL_SECRET(): string {
    return getRequiredServerEnv("PAYPAL_SECRET");
  },

  // Twilio
  get TWILIO_AUTH_TOKEN(): string {
    return getRequiredServerEnv("TWILIO_AUTH_TOKEN");
  },

  // AWS
  get AWS_SECRET_ACCESS_KEY(): string {
    return getRequiredServerEnv("AWS_SECRET_ACCESS_KEY");
  },

  // Azure
  get AZURE_STORAGE_KEY(): string {
    return getRequiredServerEnv("AZURE_STORAGE_KEY");
  },

  // SendGrid
  get SENDGRID_API_KEY(): string {
    return getRequiredServerEnv("SENDGRID_API_KEY");
  },

  // Mailchimp
  get MAILCHIMP_API_KEY(): string {
    return getRequiredServerEnv("MAILCHIMP_API_KEY");
  },

  // Algolia
  get ALGOLIA_API_KEY(): string {
    return getRequiredServerEnv("ALGOLIA_API_KEY");
  },

  // Pusher
  get PUSHER_SECRET(): string {
    return getRequiredServerEnv("PUSHER_SECRET");
  },

  // Ably
  get ABLY_API_KEY(): string {
    return getRequiredServerEnv("ABLY_API_KEY");
  },

  // Stream
  get GETSTREAM_API_SECRET(): string {
    return getRequiredServerEnv("GETSTREAM_API_SECRET");
  },

  // Contentful
  get CONTENTFUL_ACCESS_TOKEN(): string {
    return getRequiredServerEnv("CONTENTFUL_ACCESS_TOKEN");
  },

  // Prismic
  get PRISMIC_ACCESS_TOKEN(): string {
    return getRequiredServerEnv("PRISMIC_ACCESS_TOKEN");
  },

  // Storyblok
  get STORYBLOK_ACCESS_TOKEN(): string {
    return getRequiredServerEnv("STORYBLOK_ACCESS_TOKEN");
  },

  // Squidex
  get SQUIDEX_CLIENT_SECRET(): string {
    return getRequiredServerEnv("SQUIDEX_CLIENT_SECRET");
  },

  // Cosmic
  get COSMIC_READ_KEY(): string {
    return getRequiredServerEnv("COSMIC_READ_KEY");
  },

  // GraphCMS
  get GRAPHCMS_TOKEN(): string {
    return getRequiredServerEnv("GRAPHCMS_TOKEN");
  },

  // DatoCMS
  get DATOCMS_API_TOKEN(): string {
    return getRequiredServerEnv("DATOCMS_API_TOKEN");
  },

  // Craft CMS
  get CRAFT_CMS_API_TOKEN(): string {
    return getRequiredServerEnv("CRAFT_CMS_API_TOKEN");
  },

  // Cockpit
  get COCKPIT_API_TOKEN(): string {
    return getRequiredServerEnv("COCKPIT_API_TOKEN");
  },

  // Directus
  get DIRECTUS_TOKEN(): string {
    return getRequiredServerEnv("DIRECTUS_TOKEN");
  },

  // Supabase (Service Key)
  get SUPABASE_SERVICE_KEY(): string {
    return getRequiredServerEnv("SUPABASE_SERVICE_KEY");
  },

  // Appwrite
  get APPWRITE_API_KEY(): string {
    return getRequiredServerEnv("APPWRITE_API_KEY");
  },

  // PocketBase
  get POCKETBASE_ADMIN_EMAIL(): string {
    return getRequiredServerEnv("POCKETBASE_ADMIN_EMAIL");
  },
  get POCKETBASE_ADMIN_PASSWORD(): string {
    return getRequiredServerEnv("POCKETBASE_ADMIN_PASSWORD");
  },

  // Nhost
  get NHOST_ADMIN_SECRET(): string {
    return getRequiredServerEnv("NHOST_ADMIN_SECRET");
  },

  // Convex
  get CONVEX_SITE_URL(): string {
    return getRequiredServerEnv("CONVEX_SITE_URL");
  },

  // Xata
  get XATA_API_KEY(): string {
    return getRequiredServerEnv("XATA_API_KEY");
  },

  // PlanetScale
  get PLANETSCALE_PASSWORD(): string {
    return getRequiredServerEnv("PLANETSCALE_PASSWORD");
  },

  // Upstash
  get UPSTASH_REDIS_REST_TOKEN(): string {
    return getRequiredServerEnv("UPSTASH_REDIS_REST_TOKEN");
  },

  // Vercel
  get VERCEL_KV_REST_API_TOKEN(): string {
    return getRequiredServerEnv("VERCEL_KV_REST_API_TOKEN");
  },
  get VERCEL_KV_REST_API_READ_ONLY_TOKEN(): string {
    return getRequiredServerEnv("VERCEL_KV_REST_API_READ_ONLY_TOKEN");
  },
  get VERCEL_BLOB_READ_WRITE_TOKEN(): string {
    return getRequiredServerEnv("VERCEL_BLOB_READ_WRITE_TOKEN");
  },
  get VERCEL_POSTGRES_PASSWORD(): string {
    return getRequiredServerEnv("VERCEL_POSTGRES_PASSWORD");
  },
};

/**
 * Helper to get an optional server-side environment variable
 * Returns undefined if not set, useful for optional integrations
 */
function getOptionalServerEnv(name: string): string | undefined {
  ensureServerEnvironment();
  return process.env[name];
}

/**
 * Optional server-side environment variables
 * Use these for optional integrations that don't need to be configured
 * Returns undefined if the environment variable is not set
 *
 * ⚠️ SECURITY: Same browser protection as ServerEnv - will throw if accessed from browser
 */
const OptionalServerEnv = {
  // Optional Email/SMS services
  get SENDGRID_API_KEY(): string | undefined {
    return getOptionalServerEnv("SENDGRID_API_KEY");
  },
  get MAILCHIMP_API_KEY(): string | undefined {
    return getOptionalServerEnv("MAILCHIMP_API_KEY");
  },
  get TWILIO_AUTH_TOKEN(): string | undefined {
    return getOptionalServerEnv("TWILIO_AUTH_TOKEN");
  },

  // Optional CMS integrations
  get CONTENTFUL_ACCESS_TOKEN(): string | undefined {
    return getOptionalServerEnv("CONTENTFUL_ACCESS_TOKEN");
  },
  get PRISMIC_ACCESS_TOKEN(): string | undefined {
    return getOptionalServerEnv("PRISMIC_ACCESS_TOKEN");
  },
  get STORYBLOK_ACCESS_TOKEN(): string | undefined {
    return getOptionalServerEnv("STORYBLOK_ACCESS_TOKEN");
  },
  get DIRECTUS_TOKEN(): string | undefined {
    return getOptionalServerEnv("DIRECTUS_TOKEN");
  },
  get GRAPHCMS_TOKEN(): string | undefined {
    return getOptionalServerEnv("GRAPHCMS_TOKEN");
  },
  get DATOCMS_API_TOKEN(): string | undefined {
    return getOptionalServerEnv("DATOCMS_API_TOKEN");
  },
  get CRAFT_CMS_API_TOKEN(): string | undefined {
    return getOptionalServerEnv("CRAFT_CMS_API_TOKEN");
  },
  get COCKPIT_API_TOKEN(): string | undefined {
    return getOptionalServerEnv("COCKPIT_API_TOKEN");
  },
  get COSMIC_READ_KEY(): string | undefined {
    return getOptionalServerEnv("COSMIC_READ_KEY");
  },

  // Optional Payment services (if not using primary)
  get PAYPAL_SECRET(): string | undefined {
    return getOptionalServerEnv("PAYPAL_SECRET");
  },

  // Optional Database/Storage
  get XATA_API_KEY(): string | undefined {
    return getOptionalServerEnv("XATA_API_KEY");
  },
  get UPSTASH_REDIS_REST_TOKEN(): string | undefined {
    return getOptionalServerEnv("UPSTASH_REDIS_REST_TOKEN");
  },

  // Optional Realtime/Search
  get PUSHER_SECRET(): string | undefined {
    return getOptionalServerEnv("PUSHER_SECRET");
  },
  get ABLY_API_KEY(): string | undefined {
    return getOptionalServerEnv("ABLY_API_KEY");
  },
  get ALGOLIA_API_KEY(): string | undefined {
    return getOptionalServerEnv("ALGOLIA_API_KEY");
  },
  get GETSTREAM_API_SECRET(): string | undefined {
    return getOptionalServerEnv("GETSTREAM_API_SECRET");
  },

  // Optional Backend services
  get SUPABASE_SERVICE_KEY(): string | undefined {
    return getOptionalServerEnv("SUPABASE_SERVICE_KEY");
  },
  get APPWRITE_API_KEY(): string | undefined {
    return getOptionalServerEnv("APPWRITE_API_KEY");
  },
  get SQUIDEX_CLIENT_SECRET(): string | undefined {
    return getOptionalServerEnv("SQUIDEX_CLIENT_SECRET");
  },
  get NHOST_ADMIN_SECRET(): string | undefined {
    return getOptionalServerEnv("NHOST_ADMIN_SECRET");
  },

  // Optional Admin credentials
  get POCKETBASE_ADMIN_EMAIL(): string | undefined {
    return getOptionalServerEnv("POCKETBASE_ADMIN_EMAIL");
  },
  get POCKETBASE_ADMIN_PASSWORD(): string | undefined {
    return getOptionalServerEnv("POCKETBASE_ADMIN_PASSWORD");
  },
};

// Re-export for convenience
export type { ImportMetaEnv };
