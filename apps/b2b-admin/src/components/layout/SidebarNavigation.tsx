import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    shortcut?: string;
}

interface SidebarNavigationProps {
    items: NavItem[];
    activeSection: string;
    onNavigate: (sectionId: string) => void;
    bookingRef: string;
    bookingStatus: string;
    bookingAmount: string;
    logoSrc?: string; // Optional logo
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
    items,
    activeSection,
    onNavigate,
    bookingRef,
    bookingStatus,
    bookingAmount,
    logoSrc
}) => {

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (items[index]) {
                    onNavigate(items[index].id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, onNavigate]);

    return (
        <aside className="w-[240px] h-screen bg-[var(--color-bg-primary)] border-r border-[var(--color-border-light)] flex flex-col fixed left-0 top-0 z-50">
            {/* Header / Logo */}
            <div className="p-5 border-b border-[var(--color-border-light)]">
                {logoSrc ? (
                    <img src={logoSrc} alt="TripAlfa" className="h-6" />
                ) : (
                    <div className="text-lg font-bold text-[var(--color-text-primary)]">TripAlfa</div>
                )}
            </div>

            {/* Booking Summary */}
            <div className="p-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-light)]">
                <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Booking #{bookingRef}</div>
                <div className="inline-block px-2 py-0.5 text-xs font-medium rounded text-[var(--color-success)] bg-[var(--color-success-bg)] mb-2">
                    {bookingStatus}
                </div>
                <div className="text-lg font-bold text-[var(--color-text-primary)]">{bookingAmount}</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2">
                {items.map((item) => {
                    const isActive = activeSection === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={cn(
                                "flex items-center gap-3 w-full px-3 py-2.5 mb-1 rounded-md text-sm font-medium transition-all duration-150 group",
                                isActive
                                    ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border-l-[3px] border-[var(--color-primary)] pl-[9px]"
                                    : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] border-l-[3px] border-transparent"
                            )}
                        >
                            <Icon className={cn("w-4.5 h-4.5", isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)]")} />
                            <span>{item.label}</span>
                            {item.shortcut && (
                                <kbd className="ml-auto text-[11px] text-[var(--color-text-disabled)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--color-border-light)] font-sans">
                                    {item.shortcut}
                                </kbd>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Quick Actions */}
            <div className="p-4 border-t border-[var(--color-border-light)] flex gap-2">
                <button className="flex-1 px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                    Refund
                </button>
                <button className="flex-1 px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                    Amend
                </button>
            </div>
        </aside>
    );
};
