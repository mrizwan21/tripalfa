// Type declarations for pg module
declare module 'pg' {
  import { EventEmitter } from 'events';

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<Client>;
    query<T = any>(text: string, values?: any[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
  }

  export interface PoolConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean | object;
  }

  export class Client extends EventEmitter {
    constructor(config?: ClientConfig);
    connect(): Promise<void>;
    query<T = any>(text: string, values?: any[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
    release(): void;
  }

  export interface ClientConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean | object;
  }

  export interface QueryResult<T = any> {
    rows: T[];
    fields: Field[];
    command: string;
    rowCount: number;
    oid: number;
  }

  export interface Field {
    name: string;
    tableID: number;
    columnID: number;
    dataTypeID: number;
    dataTypeSize: number;
    dataTypeModifier: number;
    format: string;
  }
}