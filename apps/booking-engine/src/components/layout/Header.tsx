import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogIn, Bell } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AvatarMenu } from "../ui/AvatarMenu";
import { useTenantRuntime } from "../providers/TenantRuntimeProvider";
import { api } from "../../lib/api";
import { NAV_LINKS, APP_NAME } from "../../lib/constants";
import { useTranslation } from "../../lib/translation";
import { useCurrency } from "../../lib/currency";
import { Button } from '@/components/ui/button';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [languages, setLanguages] = useState<
    { name: string; code: string; flag?: string; isRtl?: boolean }[]
  >([]);
  const [currencies, setCurrencies] = useState<string[]>([
    "USD",
    "EUR",
    "GBP",
    "AED",
  ]);
  const [unread, setUnread] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Use the new translation hook
  const { t, currentLang, changeLanguage } = useTranslation();

  // Use the currency hook for automatic detection and conversion
  const { currency, setCurrency } = useCurrency();
  const { config: runtimeConfig } = useTenantRuntime();

  const CUR_ICON_MAP: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
  };

  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const isLoggedIn = Boolean(
    typeof window !== "undefined" &&
    localStorage.getItem("accessToken") &&
    userJson,
  );
  const user = userJson ? JSON.parse(userJson) : null;
  const logoUrl = runtimeConfig?.branding?.logoUrl || "";
  const appName = runtimeConfig?.branding?.appName || APP_NAME;
  const defaultAvatarUrl = runtimeConfig?.branding?.defaultAvatarUrl || "";

  useEffect(() => {
    (async () => {
      // Initialize languages and currencies
      try {
        let langsRes: any = null;
        try {
          langsRes = await api.get("/api/liteapi/languages");
          if (Array.isArray(langsRes) && langsRes.length) {
            if (typeof langsRes[0] === "object") {
              setLanguages(
                langsRes
                  .map((l: any) => ({
                    name: String(l.name || l.nativeName || l.code || ""),
                    code: String(l.code || l.name || "").toLowerCase(),
                    flag: typeof l.flag === "string" ? l.flag : "🌐",
                    isRtl:
                      typeof l.isRtl === "boolean"
                        ? l.isRtl
                        : ["ar", "he", "fa", "ur"].includes(
                            String(l.code || "").toLowerCase(),
                          ),
                  }))
                  .filter((l: any) => l.code),
              );
            } else {
              setLanguages(
                langsRes
                  .map((l: any) => ({
                    name: String(l),
                    code: String(l).toLowerCase(),
                    flag: "🌐",
                    isRtl: ["ar", "he", "fa", "ur"].includes(
                      String(l).toLowerCase(),
                    ),
                  }))
                  .filter((l: any) => l.code),
              );
            }
          }
        } catch {}

        try {
          const currsRes: any = await api.get("/static/currencies");
          if (Array.isArray(currsRes) && currsRes.length) {
            if (typeof currsRes[0] === "object")
              setCurrencies(currsRes.map((c: any) => c.code || c.name));
            else setCurrencies(currsRes);
          }
        } catch {}

        // Load user preferences
        try {
          const prefs: any = await api.get("/user/preferences");
          if (prefs?.currency) setCurrency(prefs.currency);
        } catch {}
      } catch (error) {
        console.error("Error loading header data:", error);
      }
    })();
  }, []);

  // Apply document direction (ltr/rtl) based on selected language
  function applyDirectionForLanguage(langCode: string, explicitRtl?: boolean) {
    const rtlCodes = new Set(["ar", "he", "fa", "ur"]);
    const code = String(langCode || "").toLowerCase();
    const languageRtl =
      typeof explicitRtl === "boolean" ? explicitRtl : rtlCodes.has(code);
    const isRtl = runtimeConfig?.branding?.rtlEnabled ? languageRtl : false;
    try {
      try {
        console.debug("applyDirectionForLanguage", { code, isRtl });
      } catch {}
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      if (code) document.documentElement.lang = code;
    } catch (e) {
      // ignore DOM errors during SSR or restricted environments
    }
  }

  useEffect(() => {
    const selected = languages.find((l) => l.code === currentLang);
    applyDirectionForLanguage(currentLang, selected?.isRtl);
  }, [currentLang, languages, runtimeConfig?.branding?.rtlEnabled]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isLoggedIn) {
        setUnread(0);
        setNotifications([]);
        return;
      }
      try {
        const cnt: any = await api.get("/notifications/unread-count");
        if (!mounted) return;
        if (typeof cnt === "number") setUnread(cnt);
        else if (cnt && typeof cnt.count === "number") setUnread(cnt.count);
        else if (Array.isArray(cnt)) setUnread(cnt.length);

        // fetch recent notifications for dropdown
        try {
          const items: any = await api.get("/notifications");
          if (!mounted) return;
          setNotifications(Array.isArray(items) ? items : []);
        } catch {
          if (mounted) setNotifications([]);
        }
      } catch {
        if (mounted) setUnread(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  async function onChangeLanguage(l: string) {
    try {
      console.log("onChangeLanguage", l);
    } catch {}

    // Use the new translation system
    await changeLanguage(l);

    // Update user preferences
    try {
      await api.post("/user/preferences", { language: l });
    } catch {}

    // Apply direction for the language
    const selected = languages.find((lang) => lang.code === l);
    try {
      applyDirectionForLanguage(l, selected?.isRtl);
    } catch {}
  }
  async function onChangeCurrency(c: string) {
    setCurrency(c);
    try {
      await api.post("/user/preferences", { currency: c });
    } catch {}
  }

  async function handleNotificationClick(n: any) {
    if (!n || !n.id) return;
    try {
      await api.post("/notifications/mark-read", { id: n.id });
    } catch {
      // ignore mock failures
    }
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
    );
    setUnread((prev) => Math.max(0, prev - (n.read ? 0 : 1)));
    if ((n as any).url) window.location.href = (n as any).url;
  }

  return (
    /* Apple Navigation Glass: 48px height, translucent dark bg, backdrop-filter blur */
    <header className="sticky top-0 z-50 w-full nav-glass" style={{ height: '48px' }}>
      <div className="container-apple h-full">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2 gap-2" aria-label="Home">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={appName}
                  className="h-6 w-auto object-contain"
                  style={{ maxHeight: '28px' }}
                />
              ) : (
                <span className="text-sm font-semibold text-white">
                  {appName}
                </span>
              )}
            </Link>

            {/* Navigation Links - Apple style: 12px, weight 400, white text */}
            <nav className="hidden md:flex items-center gap-5 h-full">
              {NAV_LINKS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-white/90 hover:text-white transition-colors h-full"
                  style={{ fontSize: '12px', fontWeight: 400, letterSpacing: 'normal' }}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Language dropdown (Radix) */}
            <div className="hidden md:flex items-center gap-2">
              {/** Resolve active language metadata from code **/}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent hover:bg-white/10 text-white px-3 py-1 text-[12px]"
                    style={{ fontSize: '12px' }}
                  >
                    <span className="text-base">
                      {languages.find((l) => l.code === currentLang)?.flag ||
                        "🌐"}
                    </span>
                    <span className="max-w-[80px] truncate">
                      {languages.find((l) => l.code === currentLang)?.name ||
                        currentLang}
                    </span>
                    <svg
                      className="h-3 w-3 text-white/70"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 8l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  className="min-w-[12rem] bg-white border rounded shadow-lg p-1 z-50"
                >
                  {languages.map((l) => (
                    <DropdownMenu.Item
                      key={l.code}
                      onSelect={() => onChangeLanguage(l.code)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded"
                    >
                      <span className="text-base">{l.flag || "🌐"}</span>
                      <span className="truncate">{l.name}</span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              {/* Currency dropdown */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent hover:bg-white/10 text-white px-3 py-1 text-[12px]"
                    style={{ fontSize: '12px' }}
                  >
                    <span className="font-medium">
                      {CUR_ICON_MAP[currency] || currency}
                    </span>
                    <span className="max-w-[60px] truncate">{currency}</span>
                    <svg
                      className="h-3 w-3 text-white/70"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 8l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  className="min-w-[6rem] bg-white border rounded shadow-lg p-1 z-50"
                >
                  {currencies.map((c) => (
                    <DropdownMenu.Item
                      key={c}
                      onSelect={() => onChangeCurrency(c)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded"
                    >
                      <span className="w-6 text-left">
                        {CUR_ICON_MAP[c] || c}
                      </span>
                      <span>{c}</span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>

            <div className="h-4 w-px bg-white/20 hidden md:block" />

            {/* Notifications (only when logged in) */}
            {isLoggedIn ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-2 rounded-md hover:bg-white/10 text-white"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white bg-[#0071e3] rounded-full">
                        {unread}
                      </span>
                    )}
                  </Button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  className="min-w-[16rem] bg-white border rounded shadow-lg p-2 z-50"
                >
                  <div className="text-sm font-medium px-2 py-1 text-gray-900">
                    {t("header.notifications")}
                  </div>
                  <div className="max-h-56 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <DropdownMenu.Item
                          key={n.id || JSON.stringify(n)}
                          onSelect={() => handleNotificationClick(n)}
                          className={`flex items-start gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer rounded ${!n.read ? "bg-slate-50" : ""}`}
                        >
                          <div className="flex-1 gap-4 min-w-0">
                            <div
                              className={`text-sm ${!n.read ? "font-semibold" : ""} truncate`}
                            >
                              {n.title || n.message || n.text}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {n.when ? new Date(n.when).toLocaleString() : ""}
                            </div>
                          </div>
                        </DropdownMenu.Item>
                      ))
                    )}
                  </div>
                  <div className="p-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = "/notifications")}
                      className="text-sm text-blue-600"
                    >
                      {t("header.view_all")}
                    </Button>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            ) : null}

            {/* Auth / Avatar */}
            {isLoggedIn ? (
              <div className="hidden md:block">
                <AvatarMenu
                  name={user?.name || user?.email || "User"}
                  avatarUrl={user?.avatar || defaultAvatarUrl}
                />
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:flex items-center gap-2 text-[12px] font-medium text-white/90 hover:text-white transition-colors"
                  style={{ fontSize: '12px', fontWeight: 400 }}
                >
                  <LogIn className="h-3 w-3" />
                  {t("header.sign_in")}
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm hidden md:flex"
                  style={{ borderRadius: '980px', fontSize: '12px' }}
                >
                  {t("header.register")}
                </Link>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full-screen overlay like Apple */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/95 backdrop-blur-xl z-40 pt-16">
          <div className="container-apple py-8 space-y-6">
            {NAV_LINKS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-4 px-4 py-3 text-lg font-medium text-white/90 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            ))}
            <div className="border-t border-white/20 pt-6 space-y-4">
              <Link
                to="/profile"
                className="flex w-full items-center gap-4 px-4 py-3 text-lg font-medium text-white/90 hover:text-white"
              >
                {t("header.language_currency")}
              </Link>
              <Link
                to="/login"
                className="flex w-full items-center gap-4 px-4 py-3 text-lg font-medium text-white/90 hover:text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
