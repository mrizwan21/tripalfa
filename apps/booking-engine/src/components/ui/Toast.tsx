import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@tripalfa/ui-components';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  position?: ToastPosition;
  onClose: (id: string) => void;
  onClick?: () => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    text: 'text-emerald-900',
  },
  error: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
    text: 'text-rose-900',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Info className="w-5 h-5 text-blue-600" />,
    text: 'text-blue-900',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    text: 'text-amber-900',
  },
};

const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  position = 'top-right',
  onClose,
  onClick,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const style = toastStyles[type];

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, duration, onClose]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    onClose(id);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onClose(id);
    }, duration);
  };

  return (
    <div
      className={cn(
        'fixed z-50 animate-in slide-in-from-top-2 fade-in duration-300',
        positionClasses[position]
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border shadow-lg cursor-pointer transition-all hover:shadow-xl',
          style.bg,
          style.border,
          onClick && 'cursor-pointer hover:opacity-95'
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', style.text)}>{title}</p>
          {message && (
            <p className={cn('text-sm mt-1 opacity-90', style.text)}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
          className={cn(
            'flex-shrink-0 mt-0.5 p-1 rounded hover:opacity-75 transition-opacity',
            type === 'success' && 'text-emerald-600',
            type === 'error' && 'text-rose-600',
            type === 'info' && 'text-blue-600',
            type === 'warning' && 'text-amber-600'
          )}
          aria-label="Dismiss notification"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

interface ToasterProps {
  toasts: Array<Omit<ToastProps, 'onClose'>>;
  onRemove: (id: string) => void;
  maxToasts?: number;
  position?: ToastPosition;
}

export const Toaster: React.FC<ToasterProps> = ({
  toasts,
  onRemove,
  maxToasts = 3,
  position = 'top-right',
}) => {
  const visibleToasts = toasts.slice(0, maxToasts);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className={cn('fixed pointer-events-auto', positionClasses[position])}>
        <div className="flex flex-col gap-2">
          {visibleToasts.map((toast) => (
            <Toast key={toast.id} {...toast} position={position} onClose={onRemove} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Toast function API
let toastId = 0;
type ToastItem = Omit<ToastProps, 'onClose'> & { onClose?: (id: string) => void };
const toasts: ToastItem[] = [];
let onToastChange: ((toasts: ToastItem[]) => void) | null = null;

export const toast = {
  success: (message: string) => {
    console.log(`Toast success: ${message}`);
  },
  error: (message: string) => {
    console.error(`Toast error: ${message}`);
  },
  info: (message: string) => {
    console.info(`Toast info: ${message}`);
  },
};
