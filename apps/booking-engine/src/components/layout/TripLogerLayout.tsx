import React, { ReactNode } from 'react';
import { TripLogerHeader } from './TripLogerHeader';
import TripLogerFooter from './TripLogerFooter';

export function TripLogerLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <TripLogerHeader />
            <main className="flex-1 relative">
                {children}
            </main>
            <TripLogerFooter />
        </div>
    );
}
