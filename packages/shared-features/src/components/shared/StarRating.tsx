import { Star } from 'lucide-react';

interface StarRatingProps {
 rating: number;
 maxStars?: number;
 size?: number;
 showEmpty?: boolean;
}

export function StarRating({ rating, maxStars = 5, size = 14, showEmpty = true }: StarRatingProps) {
 return (
 <div className="stars">
 {[...Array(maxStars)].map((_, i) => (
 <Star 
 key={i} 
 size={size} 
 className={i < rating ? 'star' : (showEmpty ? 'star empty' : 'star')}
 fill={i < rating ? '#f0c040' : 'none'} 
 />
 ))}
 </div>
 );
}
