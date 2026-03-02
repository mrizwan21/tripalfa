import { Navigate, Outlet, useLocation } from "react-router-dom";
import { matchPath } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Toaster } from "@tripalfa/ui-components/ui/sonner";
import { motion } from "framer-motion";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { routeConfig } from "@/config/routing";

export function Layout() {
  const location = useLocation();
  const { isAuthenticated, canAccessRoute, hasPermission } = useAccessControl();

  const matchedRoute = routeConfig.find((route) =>
    matchPath({ path: route.path, end: true }, location.pathname),
  );
  const hasManagePermission = Boolean(
    matchedRoute?.permissions?.some(
      (permission) =>
        permission.includes(":manage") && hasPermission(permission),
    ),
  );
  const isReadOnlyModule =
    Boolean(matchedRoute?.permissions?.length) && !hasManagePermission;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!canAccessRoute(location.pathname)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted p-6 gap-4">
        <div className="w-full max-w-lg rounded-lg border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Access denied
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view this module. Contact your admin
            to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-muted gap-4">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-6 scrollbar-thin gap-4"
        >
          <div className="mx-auto max-w-7xl">
            {isReadOnlyModule && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Read-only access: you can view this module but cannot edit or
                execute changes.
              </div>
            )}
            <div
              className={
                isReadOnlyModule ? "pointer-events-none opacity-90" : ""
              }
            >
              <Outlet />
            </div>
          </div>
        </motion.main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            padding: "16px",
            boxShadow: "var(--shadow-md)",
          },
        }}
      />
    </div>
  );
}
