import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
export interface ThemeSwitcherProps {
  className?: string;
}
export const ThemeSwitcher = ({ className = '' }: ThemeSwitcherProps) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    setTheme(next);
  };
  return (
    <button
      onClick={toggle}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
