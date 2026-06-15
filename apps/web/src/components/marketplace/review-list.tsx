'use client';

import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials, formatDate } from '@/lib/utils';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewListProps {
  reviews: Review[];
  className?: string;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
            i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </div>
  );
}

export function ReviewList({ reviews, className }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold">No reviews yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Be the first to review this listing.</p>
      </div>
    );
  }

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
        <div>
          <StarRating rating={Math.round(averageRating)} size="md" />
          <p className="text-sm text-muted-foreground mt-1">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.userAvatar} />
                  <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{review.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(review.createdAt, 'relative')}
                  </p>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
