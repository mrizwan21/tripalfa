// Type declarations for multer (booking-service)
declare module "multer" {
  import { Request } from "express";

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  interface StorageEngine {
    _handleFile(
      req: Request,
      file: File,
      callback: (error?: any, info?: Partial<File>) => void,
    ): void;
    _removeFile(
      req: Request,
      file: File,
      callback: (error: Error | null) => void,
    ): void;
  }

  interface DiskStorageOptions {
    destination?:
      | string
      | ((
          req: Request,
          file: File,
          callback: (error: Error | null, destination: string) => void,
        ) => void);
    filename?: (
      req: Request,
      file: File,
      callback: (error: Error | null, filename: string) => void,
    ) => void;
  }

  interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    fileFilter?: (
      req: Request,
      file: File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => void;
  }

  interface Multer {
    (options?: Options): any;
    single(fieldname: string): any;
    array(fieldname: string, maxCount?: number): any;
    fields(fields: Array<{ name: string; maxCount?: number }>): any;
    none(): any;
    any(): any;
  }

  function multer(options?: Options): any;

  namespace multer {
    function diskStorage(options: DiskStorageOptions): StorageEngine;
    function memoryStorage(): StorageEngine;
  }

  export = multer;
}

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}
