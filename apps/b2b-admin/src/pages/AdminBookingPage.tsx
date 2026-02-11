import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Booking } from '../types';
import { bookingApi } from '../lib/api';
import { SidebarNavigation } from '../components/layout/SidebarNavigation';
import { BentoGrid, BentoGridItem } from '../components/layout/BentoGrid';
import { GeneralSection } from '../features/bookings/components/sections/GeneralSection';
import { ContactSection } from '../features/bookings/components/sections/ContactSection';
import { CostingSection } from '../features/bookings/components/sections/CostingSection';
import { PaymentsSection } from '../features/bookings/components/sections/PaymentsSection';
import { DocumentsSection } from '../features/bookings/components/sections/DocumentsSection';
import { InvoicesSection } from '../features/bookings/components/sections/InvoicesSection';
import { HistorySection } from '../features/bookings/components/sections/HistorySection';
import { FileText, CreditCard, Clock, Plane, User, DollarSign, LayoutDashboard, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils'; // Ensure utils exists or import from source

export const AdminBookingPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('general');

    // Refs for scrolling
    const sectionRefs = {
        general: useRef<HTMLDivElement>(null),
        contact: useRef<HTMLDivElement>(null),
        costing: useRef<HTMLDivElement>(null),
        payments: useRef<HTMLDivElement>(null),
        documents: useRef<HTMLDivElement>(null),
        invoices: useRef<HTMLDivElement>(null),
        history: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        async function load() {
            if (!id) return;
            setLoading(true);
            try {
                const b = await bookingApi.getBookingById(id);
                setBooking(b);
            } catch (e) {
                console.error("Failed to load booking", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const handleNavigate = (sectionId: string) => {
        setActiveSection(sectionId);
        const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
        if (ref && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const menuItems = [
        { id: 'general', label: 'General', icon: <LayoutDashboard size={18} />, shortcut: '⌘1' },
        { id: 'contact', label: 'Contact', icon: <User size={18} />, shortcut: '⌘2' },
        { id: 'costing', label: 'Costing', icon: <DollarSign size={18} />, shortcut: '⌘3' },
        { id: 'payments', label: 'Payments', icon: <CreditCard size={18} />, shortcut: '⌘4' },
        { id: 'documents', label: 'Documents', icon: <FolderOpen size={18} />, shortcut: '⌘5' },
        { id: 'invoices', label: 'Invoices', icon: <FileText size={18} />, shortcut: '⌘6' },
        { id: 'history', label: 'History', icon: <Clock size={18} />, shortcut: '⌘7' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
    );

    if (!booking) return <div className="p-8 text-center text-red-500">Booking not found</div>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar - Fixed */}
            <div className="flex-shrink-0 z-20 h-full bg-white shadow-xl">
                <SidebarNavigation
                    items={menuItems}
                    activeSection={activeSection}
                    onNavigate={handleNavigate}
                    bookingRef={booking.reference || booking.bookingId}
                    bookingStatus={booking.status}
                    bookingAmount={`${booking.total?.currency} ${booking.total?.amount}`}
                    logoSrc="/logo.png" // Replace
                    onBack={() => navigate('/bookings')}
                />
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto h-full p-8 scroll-smooth">
                <div className="max-w-7xl mx-auto space-y-8 pb-20">
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Booking Details</h1>
                            <p className="text-sm text-[var(--color-text-secondary)]">Manage booking information and status</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-white border border-[var(--color-border-light)] rounded-md text-sm font-medium hover:bg-gray-50">Sync PNR</button>
                            <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md text-sm font-medium hover:brightness-90">Edit Booking</button>
                        </div>
                    </header>

                    <BentoGrid>
                        {/* General Section - Large */}
                        <div ref={sectionRefs.general} className="md:col-span-2 md:row-span-1">
                            <BentoGridItem
                                title="Overview"
                                icon={<Plane className="h-4 w-4 text-neutral-500" />}
                                className="h-full"
                            >
                                <GeneralSection booking={booking} />
                            </BentoGridItem>
                        </div>

                        {/* Contact Section - Tall */}
                        <div ref={sectionRefs.contact} className="md:col-span-1 md:row-span-2">
                            <BentoGridItem
                                title="Contact Info"
                                icon={<User className="h-4 w-4 text-neutral-500" />}
                                className="h-full"
                            >
                                <ContactSection booking={booking} />
                            </BentoGridItem>
                        </div>

                        {/* Costing Section */}
                        <div ref={sectionRefs.costing} className="md:col-span-1 md:row-span-1">
                            <BentoGridItem
                                title="Costing"
                                icon={<DollarSign className="h-4 w-4 text-neutral-500" />}
                                className="h-full"
                            >
                                <CostingSection booking={booking} />
                            </BentoGridItem>
                        </div>

                        {/* Payments Section */}
                        <div ref={sectionRefs.payments} className="md:col-span-1 md:row-span-1">
                            <BentoGridItem
                                title="Payments"
                                icon={<CreditCard className="h-4 w-4 text-neutral-500" />}
                                className="h-full"
                            >
                                <PaymentsSection booking={booking} />
                            </BentoGridItem>
                        </div>

                        {/* Documents Section */}
                        <div ref={sectionRefs.documents} className="md:col-span-2 md:row-span-1">
                            <BentoGridItem
                                title="Documents"
                                icon={<FolderOpen className="h-4 w-4 text-neutral-500" />}
                                className="h-full"
                            >
                                <DocumentsSection booking={booking} />
                            </BentoGridItem>
                        </div>

                        {/* Invoices Section */}
                        <div ref={sectionRefs.invoices} className="md:col-span-1 md:row-span-1">
                            <BentoGridItem
                                title="Invoices"
                                icon={<FileText className="h-4 w-4 text-neutral-500" />}
                                className="h-full"
                            >
                                <InvoicesSection booking={booking} />
                            </BentoGridItem>
                        </div>

                        {/* History Section - Full Width/Large */}
                        <div ref={sectionRefs.history} className="md:col-span-2 md:row-span-1">
                            <BentoGridItem
                                title="Activity Log"
                                icon={<Clock className="h-4 w-4 text-neutral-500" />}
                                className="h-auto min-h-[14rem]"
                            >
                                <HistorySection booking={booking} />
                            </BentoGridItem>
                        </div>
                    </BentoGrid>
                </div>
            </div>
        </div>
    );
};
