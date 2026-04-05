import * as React from 'react';
export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number;
}
export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, className = '', style, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      style={{ position: 'relative', width: '100%', paddingBottom: `${100 / ratio}%`, ...style }}
      {...props}
    >
      <div style={{ position: 'absolute', inset: 0 }}>{(props as any).children}</div>
    </div>
  )
);
AspectRatio.displayName = 'AspectRatio';
