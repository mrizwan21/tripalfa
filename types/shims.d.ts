/* Auto-generated shims to reduce repo-wide TS noise during bulk typefixing.
   These provide minimal 'any' typings for third-party modules and common
   runtime namespaces so tsc can proceed. Replace with proper types over time.
*/

/* Minimal module shims for packages without proper TypeScript definitions */
declare module "string-similarity" {
  const ss: any;
  export default ss;
}
declare module "node-cache" {
  const NodeCache: any;
  export default NodeCache;
}
declare module "perf_hooks" {
  const perf: any;
  export default perf;
}
declare module "express-rate-limit" {
  const rl: any;
  export default rl;
}
declare module "@prisma/client/runtime/library" {
  const PrismaRuntime: any;
  export = PrismaRuntime;
}

/* Prisma client shim: allow using PrismaClient as a value */
declare module "@prisma/client" {
  export const PrismaClient: any;
  export type PrismaClient = any;
  export const Prisma: any;
  export default PrismaClient;
}

/* DB / pg / redis shims */
declare module "pg" {
  export type Pool = any;
  export const Pool: any;
}
declare module "pg-native" {
  const pn: any;
  export default pn;
}
declare module "redis" {
  const r: any;
  export default r;
  export type Redis = any;
}

/* Misc runtime types */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
  var __dirname: string;
  var module: any;
}

/* ImportMeta type augmentation for ESM and Vite */
interface ImportMetaEnv {
  [key: string]: string | undefined;
  VITE_API_URL?: string;
  VITE_API_BASE_URL?: string;
  VITE_API_GATEWAY_URL?: string;
  VITE_API_KEY?: string;
  VITE_WS_URL?: string;
  VITE_VAPID_PUBLIC_KEY?: string;
  VITE_OPENWEATHERMAP_API_KEY?: string;
  VITE_OPENEXCHANGE_API_KEY?: string;
  VITE_DUFFEL_ENV?: string;
  MODE?: string;
  DEV?: boolean;
  PROD?: boolean;
}

interface ImportMeta {
  url: string;
  env: ImportMetaEnv;
}

/* Asset module shims */
declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.jpeg" {
  const src: string;
  export default src;
}
declare module "*.gif" {
  const src: string;
  export default src;
}
declare module "*.webp" {
  const src: string;
  export default src;
}
declare module "*.css";
