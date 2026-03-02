import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_RUNTIME_CONFIG,
  loadTenantRuntimeConfig,
} from "@/lib/tenantRuntimeConfig";
import type { TenantRuntimeConfig } from "@/types/runtimeConfig";

type TenantRuntimeContextValue = {
  config: TenantRuntimeConfig;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
};

const TenantRuntimeContext = createContext<TenantRuntimeContextValue>({
  config: DEFAULT_RUNTIME_CONFIG,
  isLoading: true,
  error: null,
  retry: () => {},
});

export function TenantRuntimeProvider({ children }: PropsWithChildren) {
  const [config, setConfig] = useState<TenantRuntimeConfig>(
    DEFAULT_RUNTIME_CONFIG,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const initializeRuntimeConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const runtimeConfig = await loadTenantRuntimeConfig();
        if (!mounted) return;
        setConfig(runtimeConfig);
      } catch (err) {
        if (!mounted) return;
        console.error(
          "[TenantRuntimeProvider] Failed to load runtime config:",
          err,
        );
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to load configuration"),
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeRuntimeConfig();

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  const retry = useMemo(() => () => setRetryCount((c) => c + 1), []);

  const value = useMemo(
    () => ({
      config,
      isLoading,
      error,
      retry,
    }),
    [config, isLoading, error, retry],
  );

  return (
    <TenantRuntimeContext.Provider value={value}>
      {children}
    </TenantRuntimeContext.Provider>
  );
}

export function useTenantRuntime() {
  return useContext(TenantRuntimeContext);
}
