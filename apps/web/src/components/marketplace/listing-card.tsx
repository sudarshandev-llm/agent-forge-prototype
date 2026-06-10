'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Download, DollarSign, Users } from 'lucide-react';
import { cn, getInitials, formatNumber } from '@/lib/utils';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  downloads: number;
  author: {
    name: string;
    avatar?: string;
  };
  tags: string[];
  image?: string;
  featured?: boolean;
}

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export function ListingCard({ listing, className }: ListingCardProps) {
  return (
    <Link href={`/marketplace/listings/${listing.id}`}>
      <Card
        className={cn(
          'group h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50',
          className,
        )}
      >
        <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
          {listing.image ? (
            <img
              src={listing.image}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Download className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {listing.featured && (
            <Badge className="absolute left-2 top-2" variant="default">
              Featured
            </Badge>
          )}
          <Badge variant="secondary" className="absolute right-2 top-2">
            {listing.category}
          </Badge>
        </div>

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {listing.price > 0 ? (
                <span className="flex items-center text-sm font-medium text-primary">
                  <DollarSign className="h-3 w-3" />
                  {listing.price}
                </span>
              ) : (
                <Badge variant="success" className="text-xs">
                  Free
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {listing.description}
          </p>
        </CardHeader>

        <CardContent className="px-4 pb-2">
          <div className="flex flex-wrap gap-1">
            {listing.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {listing.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{listing.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={listing.author.avatar} />
              <AvatarFallback className="text-[10px]">
                {getInitials(listing.author.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">{listing.author.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {listing.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {formatNumber(listing.downloads)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
