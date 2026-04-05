import * as React from 'react';

export const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tooltipSide?: 'top' | 'bottom' | 'left' | 'right'; title?: string }
>(
  ({ className = '', title, ...props }, ref) => (
    <div
      ref={ref}
      title={title}
      className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"
      {...props}
    />
  )
);
Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(
  ({ className = '', src, alt, ...props }, ref) => (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  )
);
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(
  ({ className = '', ...props }, ref) => (
    <span
      ref={ref}
      className={`flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium ${className}`}
      {...props}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

