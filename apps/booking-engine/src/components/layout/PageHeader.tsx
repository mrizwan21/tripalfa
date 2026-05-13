import React from 'react';
import { cn } from '@tripalfa/ui-components';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, subtitle, badge, actions, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-12', className)}
        {...props}
      >
        {(badge || actions) && (
          <div className="flex items-center justify-between mb-4">
            {badge && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#0071e3]" />
                </div>
                <span className="text-sm font-semibold text-[#0071e3] uppercase tracking-wider">
                  {badge}
                </span>
              </div>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
            {children}
          </div>
        )}
        {children && !badge && !actions && <div className="mb-4">{children}</div>}
        <h1 className="section-heading text-[#1d1d1f]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[rgba(0,0,0,0.8)] mt-2">
            {subtitle}
          </p>
        )}
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

export default PageHeader;