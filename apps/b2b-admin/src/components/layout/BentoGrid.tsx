import React from 'react';
import { cn } from '../../lib/utils';

interface BentoGridProps {
    className?: string;
    children: React.ReactNode;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ className, children }) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

interface BentoGridItemProps {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}

export const BentoGridItem: React.FC<BentoGridItemProps> = ({
    className,
    title,
    description,
    header,
    icon,
    children,
}) => {
    return (
        <div
            className={cn(
                "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent justify-between flex flex-col space-y-4",
                "border border-gray-100 shadow-sm",
                className
            )}
        >
            {header}
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                {icon}
                {title && (
                    <div className="font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2">
                        {title}
                    </div>
                )}
                {description && (
                    <div className="font-normal text-neutral-600 text-xs dark:text-neutral-300">
                        {description}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};
