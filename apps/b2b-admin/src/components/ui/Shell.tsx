import { PropsWithChildren } from 'react';
import { SidebarInset, SidebarProvider } from './Sidebar';
import { AppSidebar } from '../AppSidebar';
import Header from './Header';

export default function Shell({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary-50 text-secondary-900 antialiased dark:bg-secondary-900 dark:text-white">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto p-4 pt-0 md:p-8 md:pt-0 lg:p-10 lg:pt-0">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
