// Node.js global fallback declarations (used when @types/node cannot be resolved via pnpm symlinks)
declare const console: {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
};
declare const process: {
    env: Record<string, string | undefined>;
    argv: string[];
    exit(code?: number): never;
    cwd(): string;
    stdout: any;
    stderr: any;
};
declare const Buffer: any;
declare function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): any;
declare function clearTimeout(id?: any): void;
declare function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): any;
declare function clearInterval(id?: any): void;
declare const __dirname: string;
declare const __filename: string;

declare module '@eslint/js' {
    const configs: {
        recommended: any;
    };
    const js: { configs: typeof configs };
    export default js;
}

declare module 'pg' {
    export interface PoolConfig {
        connectionString?: string;
        host?: string;
        port?: number;
        database?: string;
        user?: string;
        password?: string;
        max?: number;
        idleTimeoutMillis?: number;
        connectionTimeoutMillis?: number;
        ssl?: any;
    }
    export interface QueryResult<T = any> {
        rows: T[];
        rowCount: number;
        command: string;
        oid: number;
        fields: any[];
    }
    export interface PoolClient {
        query<T = any>(text: string, values?: any[]): Promise<QueryResult<T>>;
        release(err?: Error): void;
    }
    export class Pool {
        constructor(config?: PoolConfig);
        connect(): Promise<PoolClient>;
        query<T = any>(text: string, values?: any[]): Promise<QueryResult<T>>;
        end(): Promise<void>;
        on(event: string, listener: (...args: any[]) => void): this;
    }
    export class Client {
        constructor(config?: PoolConfig);
        connect(): Promise<void>;
        query<T = any>(text: string, values?: any[]): Promise<QueryResult<T>>;
        end(): Promise<void>;
    }
    const pg: { Pool: typeof Pool; Client: typeof Client };
    export default pg;
}

// Support pg.Pool as a type in files using 'import pg from "pg"'
declare namespace pg {
    type Pool = import('pg').Pool;
    type Client = import('pg').Client;
    type QueryResult<T = any> = import('pg').QueryResult<T>;
    type PoolClient = import('pg').PoolClient;
}

declare module 'node-fetch' {
    export interface RequestInit {
        method?: string;
        headers?: Record<string, string> | any;
        body?: string | Buffer | null;
        timeout?: number;
        follow?: number;
        compress?: boolean;
        size?: number;
        agent?: any;
        signal?: any;
    }
    export interface Response {
        ok: boolean;
        status: number;
        statusText: string;
        url: string;
        headers: any;
        json(): Promise<any>;
        text(): Promise<string>;
        buffer(): Promise<Buffer>;
        arrayBuffer(): Promise<ArrayBuffer>;
        body: any;
    }
    const fetch: (url: string, init?: RequestInit) => Promise<Response>;
    export default fetch;
}

declare module 'jsonwebtoken' {
    export type SignOptions = {
        expiresIn?: string | number;
        algorithm?: string;
        issuer?: string;
        audience?: string;
        subject?: string;
        [key: string]: any;
    };
    export type VerifyOptions = {
        algorithms?: string[];
        audience?: string;
        issuer?: string;
        [key: string]: any;
    };
    export function sign(payload: string | object | Buffer, secret: string, options?: SignOptions): string;
    export function verify(token: string, secret: string, options?: VerifyOptions): any;
    export function decode(token: string, options?: any): any;
    const jwt: { sign: typeof sign; verify: typeof verify; decode: typeof decode };
    export default jwt;
}
