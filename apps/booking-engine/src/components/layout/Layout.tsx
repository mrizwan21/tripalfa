import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TripLogerHeader } from "./TripLogerHeader";
import TripLogerFooter from "./TripLogerFooter";
import Sidebar from "./Sidebar";
import { cn } from "@tripalfa/ui-components";

export function Layout() {
  const location = useLocation();
  const isHome =
    location.pathname === "/" ||
    location.pathname === "/flights" ||
    location.pathname === "/hotels";

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-[#242424]">
      <TripLogerHeader />
      <main className="flex-1 pt-[60px]">
        <div
          className={cn(
            "container mx-auto px-4 md:px-6",
            isHome ? "max-w-[1200px]" : "max-w-[1200px]",
          )}
        >
          <div className="flex gap-8 py-6">
            {!isHome && (
              <div className="hidden lg:block w-64 shrink-0">
                <Sidebar />
              </div>
            )}
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