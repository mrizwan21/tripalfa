import * as React from 'react';
export interface ShowMoreProps {
  maxHeight?: number;
  children?: React.ReactNode;
  className?: string;
}
export const ShowMore = ({ maxHeight = 200, children, className = '' }: ShowMoreProps) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className={className}>
      <div
        className="relative overflow-hidden"
        style={{ maxHeight: expanded ? undefined : maxHeight }}
      >
        {children}
        {!expanded && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-sm text-primary hover:underline"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
};
