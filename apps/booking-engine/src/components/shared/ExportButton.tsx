import React from 'react';
import { Download, FileText } from 'lucide-react';
import { cn } from '@tripalfa/ui-components';

interface ExportButtonProps {
    onExport: (format: 'csv' | 'pdf') => void;
    className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onExport, className }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className={cn("relative inline-block text-left", className)}>
            <button
                type="button"
                className="inline-flex items-center gap-2 justify-center w-full rounded-md border border-[var(--color-border-light)] px-4 py-2 bg-white text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            >
                <Download className="w-4 h-4" />
                Export
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-1">
                        <button
                            onClick={() => onExport('pdf')}
                            className="group flex w-full items-center px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
                        >
                            <FileText className="mr-3 h-4 w-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)]" />
                            Download PDF
                        </button>
                        <button
                            onClick={() => onExport('csv')}
                            className="group flex w-full items-center px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
                        >
                            <FileText className="mr-3 h-4 w-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)]" />
                            Download CSV
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
