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
import { Button } from "@/components/ui/button";

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2 gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={appName}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-slate-900">
                  {appName}
                </span>
              )}
            </Link>

            <nav className="hidden md:flex items-center gap-5">
              {NAV_LINKS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
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
                    variant="outline"
                    size="default"
                    className="flex items-center gap-2 bg-slate-50 rounded px-3 py-1 text-sm"
                  >
                    <span className="text-lg">
                      {languages.find((l) => l.code === currentLang)?.flag ||
                        "🌐"}
                    </span>
                    <span className="whitespace-nowrap">
                      {languages.find((l) => l.code === currentLang)?.name ||
                        currentLang}
                    </span>
                    <svg
                      className="h-4 w-4 text-slate-600"
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
                  className="min-w-[10rem] bg-white border rounded shadow p-1 z-50"
                >
                  {languages.map((l) => (
                    <DropdownMenu.Item
                      key={l.code}
                      onSelect={() => onChangeLanguage(l.code)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="text-lg">{l.flag || "🌐"}</span>
                      <span>{l.name}</span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              {/* Currency dropdown */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="flex items-center gap-2 bg-slate-50 rounded px-3 py-1 text-sm"
                  >
                    <span className="text-sm font-medium">
                      {CUR_ICON_MAP[currency] || currency}
                    </span>
                    <span className="whitespace-nowrap">{currency}</span>
                    <svg
                      className="h-4 w-4 text-slate-600"
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
                  className="min-w-[8rem] bg-white border rounded shadow p-1 z-50"
                >
                  {currencies.map((c) => (
                    <DropdownMenu.Item
                      key={c}
                      onSelect={() => onChangeCurrency(c)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
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

            <div className="h-4 w-px bg-slate-200 hidden md:block" />

            {/* Notifications (only when logged in) */}
            {isLoggedIn ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="relative p-2 rounded-md hover:bg-slate-100"
                  >
                    <Bell className="h-5 w-5 text-slate-700" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-500 rounded-full gap-2">
                        {unread}
                      </span>
                    )}
                  </Button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  className="min-w-[16rem] bg-white border rounded shadow p-2 z-50"
                >
                  <div className="text-sm font-medium px-2 py-1">
                    {t("header.notifications")}
                  </div>
                  <div className="max-h-56 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <DropdownMenu.Item
                          key={n.id || JSON.stringify(n)}
                          onSelect={() => handleNotificationClick(n)}
                          className={`flex items-start gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer ${!n.read ? "bg-white/5" : ""}`}
                        >
                          <div className="flex-1 gap-4">
                            <div
                              className={`text-sm ${!n.read ? "font-semibold" : ""}`}
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
                      size="default"
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
                  className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <LogIn className="h-4 w-4" />
                  {t("header.sign_in")}
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm hidden md:flex"
                >
                  {t("header.register")}
                </Link>
              </>
            )}

            <Button
              variant="outline"
              size="default"
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
              <Link
                to="/profile"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
              >
                {t("header.language_currency")}
              </Link>
              <Link
                to="/login"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
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
