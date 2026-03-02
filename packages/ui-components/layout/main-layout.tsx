"use client";

// Admin Panel - Main Layout
import { useState } from "react";
import { Sidebar, Header } from "./sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
