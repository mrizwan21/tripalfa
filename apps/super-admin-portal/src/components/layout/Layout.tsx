import React, { ReactNode } from 'react';
import { ThemeProvider } from '@tripalfa/ui-components';
import AdminSidebar from './AdminSidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#f5f5f7] flex">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Layout;
