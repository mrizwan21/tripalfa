import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Agent, SubUser, TravellerProfile, FlightSearch, HotelSearch, MarkupRule, AppTheme, AppNotification, UserRole } from '../types';
import { mockAgent, mockSubUsers, mockTravellers, mockMarkupRules } from '../data/mockData';
import { useTenant } from './TenantContext';
import { apiManager } from '../services/apiManager';

interface AppContextType {
  agent: Agent;
  setAgent: (a: Agent) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (b: boolean) => void;
  subUsers: SubUser[];
  setSubUsers: (u: SubUser[]) => void;
  travellers: TravellerProfile[];
  setTravellers: (t: TravellerProfile[]) => void;
  markupRules: MarkupRule[];
  setMarkupRules: (m: MarkupRule[]) => void;
  flightSearch: FlightSearch | undefined;
  setFlightSearch: (s: FlightSearch | undefined) => void;
  hotelSearch: HotelSearch | undefined;
  setHotelSearch: (s: HotelSearch | undefined) => void;
  selectedFlightId: string | null;
  setSelectedFlightId: (id: string | null) => void;
  selectedHotelId: string | null;
  setSelectedHotelId: (id: string | null) => void;
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  headerVisible: boolean;
  setHeaderVisible: (b: boolean) => void;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  toasts: AppNotification[];
  removeToast: (id: string) => void;
  updateBranding: (theme: Partial<AppTheme>) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (r: UserRole) => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
 const { tenant } = useTenant();
 const [agent, setAgent] = useState<Agent>(mockAgent);
 const [isLoggedIn, setIsLoggedIn] = useState(() => {
 if (typeof window !== 'undefined') {
 const persisted = apiManager.loadPersistedContext();
 return !!(persisted.token && persisted.tenantId);
 }
 return false;
 });
 const [currentUserRole, setCurrentUserRole] = useState<UserRole>('Admin');
 const [subUsers, setSubUsers] = useState<SubUser[]>([]);
 const [travellers, setTravellers] = useState<TravellerProfile[]>([]);
 const [markupRules, setMarkupRules] = useState<MarkupRule[]>([]);
 const [flightSearch, setFlightSearch] = useState<FlightSearch | undefined>(undefined);
 const [hotelSearch, setHotelSearch] = useState<HotelSearch | undefined>(undefined);
 const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
 const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
 const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
 const [isDarkMode, setIsDarkMode] = useState(() => {
 if (typeof window !== 'undefined') {
 return localStorage.getItem('theme') === 'dark';
 }
 return false;
 });
 const [headerVisible, setHeaderVisible] = useState(true);
 const [notifications, setNotifications] = useState<AppNotification[]>([
 {
 id: '1',
 title: 'Welcome to Saba Portal',
 message: 'Your agency branch is now synchronized with the Global GDS cluster.',
 timestamp: new Date().toISOString(),
 isRead: false,
 type: 'info'
 },
 {
 id: '2',
 title: 'Security Sync Complete',
 message: 'M-Pin protocols and biometric bridges have been initialized.',
 timestamp: new Date().toISOString(),
 isRead: true,
 type: 'success'
 }
 ]);

 const [toasts, setToasts] = useState<AppNotification[]>([]);

 const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
 const id = Date.now().toString();
 const newNotification: AppNotification = {
 ...n,
 id,
 timestamp: new Date().toISOString(),
 isRead: false
 };
 setNotifications(prev => [newNotification, ...prev]);
 setToasts(prev => [...prev, newNotification]);
 
 // Auto-remove toast after 5 seconds
 setTimeout(() => {
 removeToast(id);
 }, 5000);
 
 }, []);

 const removeToast = (id: string) => {
 setToasts(prev => prev.filter(t => t.id !== id));
 };

 const markNotificationAsRead = (id: string) => {
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
 };

 const clearNotifications = () => {
 setNotifications([]);
 };

 // Sync data with active tenant
 useEffect(() => {
 if (tenant) {
 const fetchData = async () => {
 try {
 const [loadedSubUsers, loadedTravellers, loadedRules] = await Promise.all([
 apiManager.getSubUsers(),
 apiManager.getTravellers(),
 apiManager.getMarkupRules()
 ]);
 setSubUsers(loadedSubUsers as SubUser[]);
 setTravellers(loadedTravellers as TravellerProfile[]);
 setMarkupRules(loadedRules as MarkupRule[]);
 } catch (error) {
 console.warn('[AppContext] API failure in context block. Cascading to local mock data branch.', error);
 // Fallback to mock data to maintain branch functionality
 setSubUsers(mockSubUsers as SubUser[]);
 setTravellers(mockTravellers);
 setMarkupRules(mockMarkupRules);
 } finally {
 setFlightSearch(undefined);
 setHotelSearch(undefined);
 setSelectedFlightId(null);
 setSelectedHotelId(null);
 }
 };
 fetchData();
 
 const primaryColor = tenant.id === 'saba' ? '#002147' : (tenant.id === 'elite' ? '#d4af37' : '#001a1a');
 document.documentElement.style.setProperty('--brand-primary', primaryColor);
 }
 }, [tenant]);

 const toggleDarkMode = useCallback(() => {
 setIsDarkMode(prev => !prev);
 }, []);

 useEffect(() => {
 const root = window.document.documentElement;
 if (isDarkMode) {
 root.classList.add('dark');
 localStorage.setItem('theme', 'dark');
 } else {
 root.classList.remove('dark');
 localStorage.setItem('theme', 'light');
 }
 }, [isDarkMode]);

 const updateBranding = (theme: Partial<AppTheme>) => {
 setAgent(prev => ({
 ...prev,
 theme: { ...prev.theme, ...theme } as AppTheme
 }));
 
 if (theme.primaryColor) {
 document.documentElement.style.setProperty('--brand-primary', theme.primaryColor);
 }

 if (theme.faviconUrl) {
 let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
 if (!link) {
 link = document.createElement('link');
 link.rel = 'icon';
 document.getElementsByTagName('head')[0].appendChild(link);
 }
 link.href = theme.faviconUrl;
 }
 };

 const hasPermission = useCallback((allowedRoles: UserRole[]) => {
 return allowedRoles.includes(currentUserRole);
 }, [currentUserRole]);

 return (
 <AppContext.Provider value={{
 agent, setAgent,
 isLoggedIn, setIsLoggedIn,
 subUsers, setSubUsers,
 travellers, setTravellers,
 markupRules, setMarkupRules,
 flightSearch, setFlightSearch,
 hotelSearch, setHotelSearch,
 selectedFlightId, setSelectedFlightId,
 selectedHotelId, setSelectedHotelId,
 selectedRoomId, setSelectedRoomId,
 headerVisible, setHeaderVisible,
 notifications, addNotification, markNotificationAsRead, clearNotifications,
 toasts, removeToast,
 updateBranding,
 currentUserRole, setCurrentUserRole,
 hasPermission,
 isDarkMode,
 toggleDarkMode
 }}>
 {children}
 </AppContext.Provider>
 );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
 const ctx = useContext(AppContext);
 if (!ctx) throw new Error('useApp must be used within AppProvider');
 return ctx;
}
