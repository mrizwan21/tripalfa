import React, { ReactNode } from "react";
import { TripLogerHeader } from "./TripLogerHeader";
import TripLogerFooter from "./TripLogerFooter";

export function TripLogerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans gap-4">
      <TripLogerHeader />
      <main className="flex-1 relative gap-4">{children}</main>
      <TripLogerFooter />
    </div>
  );
}
