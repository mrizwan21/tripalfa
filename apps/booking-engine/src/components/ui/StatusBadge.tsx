import React from 'react';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
    status: string;
    type?: StatusType;
    className?: string;
}

const getStatusColor = (type: StatusType) => {
    switch (type) {
        case 'success':
            return { bg: 'var(--color-success-bg)', text: 'var(--color-success)' };
        case 'warning':
            return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' };
        case 'error':
            return { bg: 'var(--color-error-bg)', text: 'var(--color-error)' };
        case 'info':
            return { bg: 'var(--color-info-bg)', text: 'var(--color-info)' };
        case 'neutral':
        default:
            return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
    }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'neutral', className = '' }) => {
    const colors = getStatusColor(type);

    return (
        <span
            className={`inline-block px-3 py-1 text-xs font-medium rounded-md ${className}`}
            style={{
                backgroundColor: colors.bg,
                color: colors.text,
            }}
        >
            {status}
        </span>
    );
};
