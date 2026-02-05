import {
    LayoutDashboard,
    Building2,
    Users,
    ShieldCheck,
    Plane,
    DollarSign,
    BarChart3,
    Settings,
    Shield,
    LogOut,
    ChevronRight,
    Megaphone,
    Award,
    Box,
    Calculator,
    UserCircle,
    Bell,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from './ui/Sidebar';
import { MAIN_MENU } from '@tripalfa/shared-utils';
import { Separator } from './ui/separator';

const iconMap: Record<string, any> = {
    LayoutDashboard,
    Building2,
    Users,
    ShieldCheck,
    Plane,
    DollarSign,
    Megaphone,
    Award,
    Box,
    Calculator,
    BarChart3,
    Settings,
    Shield,
    Bell,
};

export function AppSidebar() {
    const location = useLocation();

    return (
        <Sidebar collapsible="icon" className="border-r border-secondary-100 dark:border-secondary-800">
            <SidebarHeader className="h-16 border-b border-secondary-100 px-4 dark:border-secondary-800">
                <div className="flex items-center gap-3 py-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-lg shadow-primary-500/20">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-bold tracking-tight text-secondary-900 dark:text-white">TripAlfa</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-secondary-500">Administrator</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="gap-0 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-secondary-400">Main Menu</SidebarGroupLabel>
                    <SidebarMenu className="mt-2 space-y-1 px-2">
                        {MAIN_MENU.map((item) => {
                            const Icon = iconMap[item.icon] || Shield;
                            const hasChildren = item.children && item.children.length > 0;
                            const isActive = location.pathname.startsWith(item.href);

                            return (
                                <SidebarMenuItem key={item.id}>
                                    {hasChildren ? (
                                        <div className="group/menu-item">
                                            <SidebarMenuButton
                                                tooltip={item.label}
                                                className={`w-full justify-between rounded-lg px-3 py-2.5 transition-all duration-200 ${isActive
                                                    ? 'bg-secondary-100 text-secondary-900 dark:bg-secondary-800 dark:text-white'
                                                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-secondary-800/50 dark:hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                                                    <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">{item.label}</span>
                                                </div>
                                                <ChevronRight className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isActive ? 'rotate-90' : ''}`} />
                                            </SidebarMenuButton>
                                            <SidebarMenuSub className="ml-4 mt-1 border-l border-secondary-200 py-1 pl-2 dark:border-secondary-700">
                                                {item.children?.map((child) => (
                                                    <SidebarMenuSubItem key={child.id}>
                                                        <SidebarMenuSubButton asChild>
                                                            <NavLink
                                                                to={child.href}
                                                                className={({ isActive }) =>
                                                                    `flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${isActive
                                                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                                                                        : 'text-secondary-500 hover:bg-secondary-50 hover:text-secondary-900 dark:hover:bg-secondary-800/50 dark:hover:text-white'
                                                                    }`
                                                                }
                                                            >
                                                                {child.label}
                                                            </NavLink>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </div>
                                    ) : (
                                        <SidebarMenuButton asChild tooltip={item.label}>
                                            <NavLink
                                                to={item.href}
                                                className={({ isActive }) =>
                                                    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${isActive
                                                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                                                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-secondary-800/50 dark:hover:text-white'
                                                    }`
                                                }
                                            >
                                                <Icon className="h-4.5 w-4.5" />
                                                <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">{item.label}</span>
                                            </NavLink>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-secondary-100 p-2 dark:border-secondary-800">
                <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-400">
                        <UserCircle className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                        <span className="text-xs font-bold text-secondary-900 dark:text-white">Mohamed Rizwan</span>
                        <span className="text-[10px] text-secondary-500">Super Admin</span>
                    </div>
                    <button className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-secondary-400 hover:bg-error-50 hover:text-error-600 group-data-[collapsible=icon]:hidden dark:hover:bg-error-900/20">
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
