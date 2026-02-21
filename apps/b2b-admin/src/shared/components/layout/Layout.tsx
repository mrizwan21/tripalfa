import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Toaster } from "@tripalfa/ui-components/ui/sonner";
import { motion } from "framer-motion";

export function Layout() {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-6 scrollbar-thin"
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </motion.main>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          },
        }}
      />
    </div>
  );
}
