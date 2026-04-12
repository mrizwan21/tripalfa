// Minimal ambient declaration so browser code referencing `process.env` compiles
declare const process: {
  env: { [key: string]: string | undefined };
};
