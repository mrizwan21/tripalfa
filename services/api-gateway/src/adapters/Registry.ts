// Lightweight fallback Registry for local dev when adapters are not available.
// Returns null for any adapter name so api-gateway can start safely.
type Adapter = { request?: (body: any) => Promise<any> } | null;

const Registry = {
  getAdapter: (_name: string): Adapter => null,
};

export default Registry;