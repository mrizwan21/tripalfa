import * as React from 'react';
import { cn } from '@tripalfa/shared-utils';

const GAP_VALUES = {
  0: 'gap-0',
  0.5: 'gap-0.5',
  1: 'gap-1',
  1.5: 'gap-1.5',
  2: 'gap-2',
  2.5: 'gap-2.5',
  3: 'gap-3',
  3.5: 'gap-3.5',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  16: 'gap-16',
} as const;

type GapSize = keyof typeof GAP_VALUES;

interface StackBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: GapSize;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

const alignMap: Record<NonNullable<StackBaseProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyMap: Record<NonNullable<StackBaseProps['justify']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const Stack = React.forwardRef<HTMLDivElement, StackBaseProps>(
  ({ className, gap = 4, align = 'stretch', justify = 'start', wrap = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex',
        GAP_VALUES[gap],
        alignMap[align],
        justifyMap[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    />
  )
);
Stack.displayName = 'Stack';

const VStack = React.forwardRef<HTMLDivElement, StackBaseProps>(
  ({ className, gap = 4, align = 'stretch', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col', GAP_VALUES[gap], alignMap[align], className)}
      {...props}
    />
  )
);
VStack.displayName = 'VStack';

const HStack = React.forwardRef<HTMLDivElement, StackBaseProps>(
  ({ className, gap = 4, align = 'center', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-row', GAP_VALUES[gap], alignMap[align], className)}
      {...props}
    />
  )
);
HStack.displayName = 'HStack';

export { Stack, VStack, HStack };
export type { StackBaseProps, GapSize };
