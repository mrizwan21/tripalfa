import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Menu,
  X,
  User,
  Plane,
  Building2,
  Heart,
  Wallet,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
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

  const navLinks = [
    { label: "Flights", href: "/flights", icon: Plane },
    { label: "Hotels", href: "/hotels", icon: Building2 },
    { label: "Deals", href: "/deals", icon: Heart },
    { label: "Support", href: "/help", icon: null },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-white shadow-sm border-b border-gray-100"
          : "bg-white",
      )}
    >
      {/* Main Navigation Bar */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-[#003b95] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-[#003b95] hidden sm:block">
              {appName}
            </span>
          </Link>

          {/* Desktop Navigation - Kayak-style clean links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname.startsWith(item.href)
                    ? "text-[#003b95] bg-blue-50"
                    : "text-[#5e5e5e] hover:text-[#003b95] hover:bg-gray-50",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Currency Selector */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-[#5e5e5e] hover:text-[#003b95] hover:bg-gray-50 rounded-md transition-colors">
                  {selectedCurr.code}
                  <ChevronDown size={14} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                align="end"
                className="min-w-[140px] bg-white rounded-lg shadow-lg border p-1 z-50"
              >
                {currencies.map((c) => (
                  <DropdownMenu.Item
                    key={c.code}
                    onClick={() => setSelectedCurr(c)}
                    className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <span>{c.code}</span>
                    <span className="ml-2 text-gray-400">- {c.name}</span>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            {/* Language Selector */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-[#5e5e5e] hover:text-[#003b95] hover:bg-gray-50 rounded-md transition-colors">
                  <span>{selectedLang.flag}</span>
                  <span>{selectedLang.code.toUpperCase()}</span>
                  <ChevronDown size={14} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                align="end"
                className="min-w-[160px] bg-white rounded-lg shadow-lg border p-1 z-50"
              >
                {(languages.length ? languages : [selectedLang]).map((l) => (
                  <DropdownMenu.Item
                    key={l.code}
                    onClick={() => onChangeLanguage(l)}
                    className="px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            {/* Notifications */}
            {isLoggedIn && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="relative p-2 text-[#5e5e5e] hover:text-[#003b95] hover:bg-gray-50 rounded-md transition-colors">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-[#ff5722] rounded-full text-[10px] text-white flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  align="end"
                  className="w-72 bg-white rounded-lg shadow-lg border p-2 z-50"
                >
                  <div className="px-3 py-2 font-semibold text-sm text-[#242424] border-b border-gray-100">
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenu.Item
                        key={n.id}
                        className="px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <p className="text-sm text-[#242424]">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                      </DropdownMenu.Item>
                    ))
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            )}

            {/* User Menu */}
            {isLoggedIn ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#003b95] flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-[#242424]">
                      {displayName}
                    </span>
                    <ChevronDown size={14} className="hidden lg:block text-gray-400" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  align="end"
                  className="w-56 bg-white rounded-lg shadow-lg border p-2 z-50"
                >
                  <div className="px-3 py-2 mb-2 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-[#242424]">
                      {displayName}
                    </p>
                  </div>
                  <DropdownMenu.Item
                    onClick={() => navigate("/dashboard")}
                    className="px-3 py-2 text-sm rounded-md hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  >
                    <User size={16} />
                    Dashboard
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => navigate("/bookings")}
                    className="px-3 py-2 text-sm rounded-md hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  >
                    <Plane size={16} />
                    My Bookings
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => navigate("/wallet")}
                    className="px-3 py-2 text-sm rounded-md hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  >
                    <Wallet size={16} />
                    Wallet
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => navigate("/account-settings")}
                    className="px-3 py-2 text-sm rounded-md hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  >
                    Settings
                  </DropdownMenu.Item>
                  <div className="border-t border-gray-100 my-1" />
                  <DropdownMenu.Item
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm rounded-md hover:bg-red-50 text-red-500 cursor-pointer"
                  >
                    Sign Out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#5e5e5e] font-medium"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-[#003b95] text-white font-medium text-sm px-4 py-2 rounded-md hover:bg-[#002a6e] transition-colors hidden sm:block"
                  onClick={() => navigate("/register")}
                >
                  Create Account
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-[#5e5e5e] hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4">
          <nav className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-md",
                  location.pathname.startsWith(item.href)
                    ? "text-[#003b95] bg-blue-50"
                    : "text-[#5e5e5e]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}