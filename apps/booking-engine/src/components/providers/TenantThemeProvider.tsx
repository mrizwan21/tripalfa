import { PropsWithChildren, useEffect, useState } from "react";
import { applyBrandingToRoot, loadTenantBranding } from "@/lib/tenantBranding";

export function TenantThemeProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeBranding = async () => {
      const brandingConfig = await loadTenantBranding();
      if (!mounted) return;
      applyBrandingToRoot(brandingConfig);
      setIsReady(true);
    };

    void initializeBranding();

    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
