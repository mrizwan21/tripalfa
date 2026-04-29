import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export const getNotificationIcon = (type: 'success' | 'warning' | 'error' | 'info') => {
  switch (type) {
    case 'success':
      return <CheckCircle2 size={16} className="text-emerald-500" />;
    case 'warning':
      return <AlertTriangle size={16} className="text-amber-500" />;
    case 'error':
      return <XCircle size={16} className="text-rose-500" />;
    case 'info':
    default:
      return <Info size={16} className="text-apple-blue" />;
  }
};
