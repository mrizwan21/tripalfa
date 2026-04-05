import * as React from 'react';
import { Star } from 'lucide-react';
export interface StarRatingProps {
  value?: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
}
export const StarRating = ({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
  className = '',
}: StarRatingProps) => (
  <div className={`flex gap-1 ${className}`}>
    {Array.from({ length: max }).map((_, i) => (
      <button
        key={i}
        onClick={() => !readOnly && onChange?.(i + 1)}
        disabled={readOnly}
        className={`${readOnly ? '' : 'cursor-pointer hover:scale-110'} transition-transform`}
      >
        <Star
          className={`h-5 w-5 ${i < value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
        />
      </button>
    ))}
  </div>
);
