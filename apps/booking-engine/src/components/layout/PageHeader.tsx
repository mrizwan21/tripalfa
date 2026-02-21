import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AvatarMenu } from "../ui/AvatarMenu";
import { Bell } from "lucide-react";
import { api } from "../../lib/api";

/**
 * PageHeader — consistent header used across pages.
 * Features:
 * - Title + optional subtitle
 * - Action slot (buttons)
 * - Language & currency selectors (attempts to load from API, falls back to built-in list)
 * - When signed in: show notification bell with dynamic unread count and AvatarMenu
 * - When not signed in: show Sign in / Register links
 */

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const FALLBACK_LANGUAGES = ["English", "Arabic", "French", "Spanish"];
const FALLBACK_CURRENCIES = ["USD", "EUR", "GBP", "AED"];

export default function PageHeader({ title, subtitle, actions }: Props) {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<string[]>(FALLBACK_LANGUAGES);
  const [currencies, setCurrencies] = useState<string[]>(FALLBACK_CURRENCIES);
  const [language, setLanguage] = useState<string>(FALLBACK_LANGUAGES[0]);
  const [currency, setCurrency] = useState<string>(FALLBACK_CURRENCIES[0]);
  const [unread, setUnread] = useState<number>(0);

  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const isLoggedIn = Boolean(typeof window !== "undefined" && localStorage.getItem("accessToken") && userJson);
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    // try to load static lists from backend; fall back silently
    (async () => {
      try {
        const langs: any = await api.get("/static/languages");
        if (Array.isArray(langs) && langs.length) setLanguages(langs);
      } catch {
        /* ignore */
      }
      try {
        const currs: any = await api.get("/static/currencies");
        if (Array.isArray(currs) && currs.length) setCurrencies(currs);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    // load user's saved preferences (if backend supports it)
    (async () => {
      try {
        const prefs: any = await api.get("/user/preferences");
        if (prefs?.language) setLanguage(prefs.language);
        if (prefs?.currency) setCurrency(prefs.currency);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    // fetch unread notification count when logged in
    let mounted = true;
    (async () => {
      if (!isLoggedIn) {
        setUnread(0);
        return;
      }
      try {
        const cnt: any = await api.get("/notifications/unread-count");
        if (!mounted) return;
        if (typeof cnt === "number") setUnread(cnt);
        else if (cnt && typeof cnt.count === "number") setUnread(cnt.count);
        else if (Array.isArray(cnt)) setUnread(cnt.length);
      } catch {
        // fallback: 0
        if (mounted) setUnread(0);
      }
    })();
    return () => { mounted = false; };
  }, [isLoggedIn]);

  async function onChangeLanguage(l: string) {
    setLanguage(l);
    try { await api.post("/user/preferences", { language: l }); } catch { /* ignore */ }
  }
  async function onChangeCurrency(c: string) {
    setCurrency(c);
    try { await api.post("/user/preferences", { currency: c }); } catch { /* ignore */ }
  }

  return (
    <header className="mb-4 rounded-lg bg-white border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
    </header>
  );
}
