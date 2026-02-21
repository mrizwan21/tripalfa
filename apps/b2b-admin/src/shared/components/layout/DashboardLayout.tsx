/**
 * Futuristic Dashboard Layout
 * Modern, sleek UI with cyberpunk-inspired design
 */

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

const {
    LayoutGrid,
    Settings,
    TrendingUp,
    Zap,
    AlertCircle,
    Activity,
    ChevronRight,
    Search,
    Bell,
    Moon,
    Sun,
    Menu,
    X,
    Sparkles,
    Car
} = Icons as any;

interface DashboardLayoutProps {
    children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        // Default to dark mode for futuristic theme
        document.documentElement.classList.add('dark');
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const navItems = [
        { icon: LayoutGrid, label: 'Dashboard', href: '#', active: true },
        { icon: TrendingUp, label: 'Analytics', href: '#' },
        { icon: Zap, label: 'Rules Engine', href: '#' },
        { icon: Activity, label: 'API Status', href: '#' },
        { icon: Settings, label: 'Configuration', href: '#' },
    ];

    return (
        <div className="flex h-screen bg-[#0a0e17]">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'
                    } bg-gradient-to-b from-[#050810] via-[#0a0e17] to-[#050810] text-white transition-all duration-300 border-r border-cyan-500/10 hidden md:flex flex-col relative overflow-hidden`}
            >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                
                {/* Logo */}
                <div className="p-6 border-b border-cyan-500/10 flex items-center justify-between relative z-10">
                    {sidebarOpen && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                                <Car className="w-5 h-5 relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold gradient-text">
                                    TripAlfa
                                </h1>
                                <p className="text-xs text-cyan-400/60 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Admin Portal
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-thin relative z-10">
                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                                item.active
                                    ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                                    : 'text-slate-400 hover:bg-cyan-500/5 hover:text-cyan-300 border border-transparent'
                            }`}
                        >
                            {item.active && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-purple-500 shadow-lg shadow-cyan-500/50" />
                            )}
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 ${
                                item.active
                                    ? 'bg-gradient-to-br from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-500/25'
                                    : 'bg-slate-800/50 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10'
                            }`}>
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                            </div>
                            {sidebarOpen && (
                                <>
                                    <span className="flex-1">{item.label}</span>
                                    {item.active && (
                                        <ChevronRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </>
                            )}
                        </a>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-cyan-500/10 space-y-2 relative z-10">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full px-4 py-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-xl transition-colors text-sm border border-transparent hover:border-cyan-500/20"
                    >
                        {sidebarOpen ? '← Collapse' : '→'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background grid effect */}
                <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
                
                {/* Gradient overlays */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Header */}
                <header className="bg-[#0a0e17]/80 backdrop-blur-xl border-b border-cyan-500/10 px-6 py-4 flex items-center justify-between relative z-20">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Mobile Menu */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden p-2 hover:bg-cyan-500/5 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
                                <input
                                    type="text"
                                    placeholder="Search rules, endpoints..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/30 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <button className="relative p-2.5 hover:bg-cyan-500/5 rounded-xl transition-colors border border-transparent hover:border-cyan-500/20">
                            <Bell className="w-5 h-5 text-slate-400 hover:text-cyan-400" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse"></span>
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 hover:bg-cyan-500/5 rounded-xl transition-colors border border-transparent hover:border-cyan-500/20"
                        >
                            {isDarkMode ? (
                                <Sun className="w-5 h-5 text-amber-400" />
                            ) : (
                                <Moon className="w-5 h-5 text-slate-400 hover:text-cyan-400" />
                            )}
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-3 border-l border-cyan-500/10">
                            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-cyan-500/25">
                                AR
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-white">Admin</p>
                                <p className="text-xs text-cyan-400/60">Super Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto relative z-10">
                    <div className="p-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
