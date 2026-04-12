import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../lib/hooks';

export function AvatarMenu({ name, avatarUrl }: { name?: string; avatarUrl?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const logout = useLogout();

  const [displayName, setDisplayName] = useState<string>(name || 'Guest');
  const [displayAvatar, setDisplayAvatar] = useState<string>(avatarUrl || '');

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u && !name) {
      try {
        const parsed = JSON.parse(u);
        if (parsed?.name) setDisplayName(parsed.name);
        if (parsed?.avatar && !avatarUrl) setDisplayAvatar(parsed.avatar);
      } catch {
        // ignore
      }
    } else if (name) {
      setDisplayName(name);
    }
    if (avatarUrl) setDisplayAvatar(avatarUrl);
  }, [name, avatarUrl]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleSignOut = () => {
    setOpen(false);
    logout.mutate();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(s => !s)}
        className="flex items-center gap-2 bg-card/10 hover:bg-card/20 px-3 py-1.5 rounded-full text-white shadow-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account"
      >
        {displayAvatar ? (
          <img src={displayAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-near-black flex items-center justify-center text-white font-semibold gap-2">
            {displayName ? displayName.charAt(0).toUpperCase() : 'G'}
          </span>
        )}
        <span className="text-sm hidden sm:inline">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg ring-1 ring-black/5 py-2 z-50">
          <button
            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 rounded-md"
            onClick={() => {
              setOpen(false);
              navigate('/account-settings');
            }}
          >
            Account settings
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 rounded-md"
            onClick={() => {
              setOpen(false);
              navigate('/wallet');
            }}
          >
            Wallet
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/50 rounded-md"
            onClick={() => {
              setOpen(false);
              navigate('/bookings');
            }}
          >
            My bookings
          </button>
          <div className="border-t my-1" />
          <button
            className="w-full text-left px-4 py-2 text-sm text-neutral-500 hover:bg-muted/50 rounded-md"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
