/**
 * Separator Component
 * Visual divider for filter sections
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true }, ref) => {
    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={decorative ? undefined : orientation}
        className={cn(
          'shrink-0 bg-border',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          className
        )}
      />
    );
  }
);

Separator.displayName = 'Separator';

export { Separator };
