import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@tripalfa/ui-components';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
    closeButtonClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    headerClassName,
    closeButtonClassName
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    "relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                    className
                )}
            >
                <div className={cn("flex justify-between items-center p-4 border-b border-[var(--color-border-light)]", headerClassName)}>
                    <div className="flex-1">
                        {typeof title === 'string' ? (
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
                        ) : (
                            title
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className={cn(
                            "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded-full hover:bg-black/5 ml-2",
                            closeButtonClassName
                        )}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
};
