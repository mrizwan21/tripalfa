declare module "morgan" {
  import { RequestHandler } from "express";

  type FormatFunc = (tokens: any, req: any, res: any) => string;
  type Format = string | FormatFunc;

  function morgan(format: Format, options?: any): RequestHandler;

  namespace morgan {
    function token(
      name: string,
      callback: (req: any, res: any) => string,
    ): void;
  }

  export = morgan;
}
