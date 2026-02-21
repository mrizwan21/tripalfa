import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TripLogerHeader } from './TripLogerHeader';
import TripLogerFooter from './TripLogerFooter';
import Sidebar from './Sidebar';
import { cn } from '@tripalfa/ui-components';

export function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/flights' || location.pathname === '/hotels';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 font-sans text-slate-900">
      <TripLogerHeader />
      <main className="flex-1 pt-24 pb-12">
        <div className={cn(
          "container mx-auto px-6",
          isHome ? "max-w-7xl" : "max-w-[1440px]"
        )}>
          <div className="flex gap-10">
            {!isHome && <Sidebar />}
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <TripLogerFooter />
    </div>
  );
}
