/// <reference types="vite/client" />

declare module '*.tsx' {
  const component: React.ComponentType;
  export default component;
}

declare module '*.ts' {
  const module: Record<string, unknown>;
  export default module;
}
