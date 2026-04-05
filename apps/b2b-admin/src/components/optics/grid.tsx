import * as React from 'react';
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number;
  gap?: number | string;
}
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ cols = 1, gap = 4, className = '', style, ...props }, ref) => (
    <div
      ref={ref}
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: typeof gap === 'number' ? `${gap * 0.25}rem` : gap,
        ...style,
      }}
      {...props}
    />
  )
);
Grid.displayName = 'Grid';
