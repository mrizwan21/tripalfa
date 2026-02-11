import { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-600" />;
  }
};

const getBackgroundColor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200';
  }
};

const getTextColor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'text-green-800';
    case 'error':
      return 'text-red-800';
    case 'warning':
      return 'text-yellow-800';
    case 'info':
    default:
      return 'text-blue-800';
  }
};

export const NotificationToast = ({ toast, onClose }: NotificationToastProps) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const type = toast.type || 'info';
  const bgColor = getBackgroundColor(type);
  const textColor = getTextColor(type);

  return (
    <Card
      className={`${bgColor} border ${textColor} p-4 shadow-lg max-w-md animate-in fade-in slide-in-from-top-2`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon(type)}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.message}</p>

          {/* Action Button */}
          {toast.action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toast.action.onClick}
              className="mt-2 text-xs h-auto p-0"
            >
              {toast.action.label}
            </Button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <span className="sr-only">Close</span>
          <X className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
};

interface NotificationToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const NotificationToastContainer = ({ toasts, onClose }: NotificationToastContainerProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 pointer-events-auto">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <NotificationToast toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook for managing toast notifications
 * Usage:
 * const { toasts, showToast, removeToast } = useToast();
 * showToast('Success!', 'success', 3000);
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: ToastType = 'info',
    duration: number = 3000,
    action?: Toast['action']
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      action,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const removeAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    removeToast,
    removeAll,
  };
};
