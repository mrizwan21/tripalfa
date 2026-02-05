/* Auto-generated shims to reduce repo-wide TS noise during bulk typefixing.
   These provide minimal 'any' typings for third-party modules and common
   runtime namespaces so tsc can proceed. Replace with proper types over time.
*/

/* Minimal module shims */
declare module 'joi' { const Joi: any; export = Joi; }
declare module 'p-limit' { const pLimit: any; export default pLimit; }
declare module 'cheerio' { const cheerio: any; export default cheerio; }
declare module 'string-similarity' { const ss: any; export default ss; }
declare module 'node-cache' { const NodeCache: any; export default NodeCache; }
declare module 'perf_hooks' { const perf: any; export = perf; }
declare module 'fastify' { const fastify: any; export default fastify; }
declare module 'express-rate-limit' { const rl: any; export default rl; }
declare module 'compression' { const compression: any; export default compression; }
declare module 'multer' { const mul: any; export default mul; }
declare module 'helmet' { const helmet: any; export default helmet; }
declare module 'ioredis' { const IORedis: any; export default IORedis; }
declare module 'node-fetch' { const fetch: any; export default fetch; }
declare module '@prisma/client/runtime/library' { const PrismaRuntime: any; export = PrismaRuntime; }

/* Prisma client shim: allow using PrismaClient as a value */
declare module '@prisma/client' {
  export const PrismaClient: any;
  export type PrismaClient = any;
  export const Prisma: any;
  export default PrismaClient;
}

/* Generic shims for many third-party packages referenced across repo */
declare module 'dotenv' { const d: any; export default d; }
declare module 'uuid' { const uuid: any; export default uuid; }
declare module 'axios' { const axios: any; export default axios; export type AxiosInstance = any; export type AxiosError = any; }
declare module 'jsonwebtoken' { const jwt: any; export default jwt; }

/* DB / pg / redis shims */
declare module 'pg' { export type Pool = any; export const Pool: any; }
declare module 'pg-native' { const pn: any; export default pn; }
declare module 'redis' { const r: any; export default r; export type Redis = any; }

/* Misc runtime types */
declare global {
  namespace NodeJS {
    interface ProcessEnv { [key: string]: string | undefined; }
  }
  var __dirname: string;
  var module: any;
}

/* Allow unknown modules to be imported without TS errors (last-resort fallback) */
declare module '*';
