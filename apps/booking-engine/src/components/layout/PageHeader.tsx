import React from "react";

/**
 * PageHeader — consistent header used across pages.
 * Features:
 * - Title + optional subtitle
 * - Action slot (buttons)
 * - Language & currency selectors (loaded from API)
 * - When signed in: show notification bell with dynamic unread count and AvatarMenu
 * - When not signed in: show Sign in / Register links
 */

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="mb-4 rounded-lg bg-white border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
