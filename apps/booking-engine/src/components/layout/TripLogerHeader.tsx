import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "../ui/button";
import { cn } from "@tripalfa/ui-components";
import { api } from "../../lib/api";
import { getCurrentLanguage, setCurrentLanguage } from "../../lib/translation";
import { useTenantRuntime } from "../providers/TenantRuntimeProvider";

type LanguageOption = {
  name: string;
  code: string;
  flag?: string;
  isRtl?: boolean;
};

export function TripLogerHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: runtimeConfig } = useTenantRuntime();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "SAR", name: "Saudi Riyal", symbol: "SR" },
    { code: "EUR", name: "Euro", symbol: "€" },
  ];

  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedLang, setSelectedLang] = useState<LanguageOption>({
    name: "English",
    code: getCurrentLanguage() || "en",
    flag: "🇺🇸",
  });
  const [selectedCurr, setSelectedCurr] = useState(currencies[0]);

  const notifications = [
    { id: 1, title: "Price drop: DXB to LHR", time: "2m", read: false },
    { id: 2, title: "Booking confirmed: Hilton", time: "1h", read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  function applyDirectionForLanguage(langCode: string, explicitRtl?: boolean) {
    const rtlCodes = new Set(["ar", "he", "fa", "ur"]);
    const code = String(langCode || "").toLowerCase();
    const languageRtl =
      typeof explicitRtl === "boolean" ? explicitRtl : rtlCodes.has(code);
    const isRtl = runtimeConfig?.branding?.rtlEnabled ? languageRtl : false;
    try {
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      if (code) document.documentElement.lang = code;
    } catch {
      // ignore dom update issues
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) setIsLoggedIn(true);
    else setIsLoggedIn(true); // Demo mode

    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) setCurrentUser(JSON.parse(rawUser));
    } catch {
      // ignore
    }

    (async () => {
      try {
        const langs: any = await api.get("/api/liteapi/languages");
        if (Array.isArray(langs) && langs.length) {
          const mapped = langs
            .map((l: any) => ({
              code: String(l.code || l.name || "").toLowerCase(),
              name: String(l.name || l.code || ""),
              flag: typeof l.flag === "string" ? l.flag : "🌐",
              isRtl:
                typeof l.isRtl === "boolean"
                  ? l.isRtl
                  : ["ar", "he", "fa", "ur"].includes(
                      String(l.code || "").toLowerCase(),
                    ),
            }))
            .filter((l: LanguageOption) => l.code && l.name);

          if (mapped.length) {
            setLanguages(mapped);
            const currentCode = getCurrentLanguage();
            const current =
              mapped.find((l: LanguageOption) => l.code === currentCode) ||
              mapped[0];
            setSelectedLang(current);
            applyDirectionForLanguage(current.code, current.isRtl);
          }
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  async function onChangeLanguage(lang: LanguageOption) {
    setSelectedLang(lang);
    setCurrentLanguage(lang.code);
    applyDirectionForLanguage(lang.code, lang.isRtl);
    try {
      await api.post("/user/preferences", { language: lang.code });
    } catch {
      // ignore
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  };

  const logoUrl = runtimeConfig?.branding?.logoUrl || "/logo.png";
  const appName = runtimeConfig?.branding?.appName || "TripAlfa";
  const avatarUrl =
    currentUser?.avatar || runtimeConfig?.branding?.defaultAvatarUrl || "";
  const displayName = currentUser?.name || "User";
  const displayEmail = currentUser?.email || "user@example.com";

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b shadow-sm h-16"
          : "bg-white h-20",
      )}
    >
      <div className="container mx-auto px-6 h-full flex items-center justify-between gap-2">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group transition-transform hover:scale-[1.02]"
        >
          <img
            src={logoUrl}
            alt={`${appName} Logo`}
            className="h-8 md:h-10 object-contain"
          />
        </Link>

        {/* Main Nav (Hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-8">
          {[
            { label: "Flights", href: "/flights" },
            { label: "Hotels", href: "/hotels" },
            { label: "Deals", href: "/deals" },
            { label: "Support", href: "/help" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-primary",
                location.pathname.startsWith(item.href)
                  ? "text-primary"
                  : "text-slate-600",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Functional Dropdowns */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/60">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button
                      variant="primary"
                      size="md"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:bg-white hover:shadow-sm transition-all outline-none"
                    >
                      {selectedCurr.code}{" "}
                      <ChevronDown size={14} className="opacity-50" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    align="center"
                    className="min-w-[120px] bg-white rounded-2xl shadow-xl border p-1 z-50 animate-in fade-in zoom-in-95"
                  >
                    {currencies.map((c) => (
                      <DropdownMenu.Item
                        key={c.code}
                        onClick={() => setSelectedCurr(c)}
                        className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl cursor-pointer hover:bg-slate-50 outline-none gap-2"
                      >
                        <span>{c.code}</span>
                        {selectedCurr.code === c.code && (
                          <Check size={14} className="text-emerald-600" />
                        )}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button
                      variant="primary"
                      size="md"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:bg-white hover:shadow-sm transition-all outline-none"
                    >
                      <span>{selectedLang.flag || "🌐"}</span>{" "}
                      {selectedLang.code.toUpperCase()}{" "}
                      <ChevronDown size={14} className="opacity-50" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    align="center"
                    className="min-w-[120px] bg-white rounded-2xl shadow-xl border p-1 z-50 animate-in fade-in zoom-in-95"
                  >
                    {(languages.length ? languages : [selectedLang]).map(
                      (l) => (
                        <DropdownMenu.Item
                          key={l.code}
                          onClick={() => onChangeLanguage(l)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl cursor-pointer hover:bg-slate-50 outline-none gap-2"
                        >
                          <span className="flex items-center gap-2">
                            <span>{l.flag || "🌐"}</span> {l.name}
                          </span>
                          {selectedLang.code === l.code && (
                            <Check size={14} className="text-emerald-600" />
                          )}
                        </DropdownMenu.Item>
                      ),
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>

              {/* Notifications */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="primary"
                    size="sm"
                    className="relative w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors outline-none group gap-2"
                  >
                    <Bell
                      size={20}
                      className="text-slate-600 group-hover:text-primary transition-colors"
                    />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white translate-x-1 -translate-y-1 gap-2">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={12}
                  className="w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 overflow-hidden"
                >
                  <div className="px-4 py-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Recent Alerts
                    </span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest cursor-pointer hover:underline">
                      Clear all
                    </span>
                  </div>
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <DropdownMenu.Item
                        key={n.id}
                        className="p-3 rounded-2xl hover:bg-slate-50 cursor-pointer outline-none flex gap-3 items-start transition-colors"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        <div className="flex-1 gap-4">
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {n.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {n.time} ago
                          </p>
                        </div>
                      </DropdownMenu.Item>
                    ))}
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              {/* User Menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="outline"
                    size="md"
                    className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 overflow-hidden border border-white/20">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white gap-2">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="hidden md:block text-xs font-bold tracking-tight">
                      {displayName}
                    </span>
                    <ChevronDown size={14} className="opacity-50" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={12}
                  className="w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-4 py-3 mb-2 bg-slate-50 rounded-2xl">
                    <p className="text-xs font-bold text-slate-900">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {displayEmail}
                    </p>
                  </div>
                  {[
                    {
                      label: "User Dashboard",
                      icon: LayoutDashboard,
                      href: "/dashboard",
                    },
                    {
                      label: "Booking History",
                      icon: Check,
                      href: "/bookings",
                    },
                    {
                      label: "Account Settings",
                      icon: Settings,
                      href: "/account-settings",
                    },
                  ].map((item) => (
                    <DropdownMenu.Item
                      key={item.label}
                      onClick={() => navigate(item.href)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer outline-none transition-colors"
                    >
                      <item.icon size={16} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">
                        {item.label}
                      </span>
                    </DropdownMenu.Item>
                  ))}
                  <div className="h-px bg-slate-100 my-2 mx-2" />
                  <DropdownMenu.Item
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-rose-500 cursor-pointer outline-none transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-xs font-bold">Sign Out</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-slate-600 font-bold text-sm h-10 px-5"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button className="bg-slate-900 text-white font-bold text-sm h-10 px-6 rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                Create Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
