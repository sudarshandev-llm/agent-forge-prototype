'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingCard, type Listing } from '@/components/marketplace/listing-card';
import { Search, SlidersHorizontal, Download, Star, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  'All',
  'Content Writing',
  'Customer Support',
  'Data Analysis',
  'Code Generation',
  'Image Generation',
  'Research',
  'Automation',
  'Translation',
];

const sortOptions = [
  { value: 'downloads', label: 'Most Downloads' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price', label: 'Price' },
];

const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Content Writer Pro',
    description: 'Generate high-quality blog posts, articles, and marketing copy with AI-powered content creation.',
    price: 0,
    category: 'Content Writing',
    rating: 4.8,
    downloads: 12340,
    author: { name: 'AI Labs' },
    tags: ['writing', 'blog', 'seo'],
    featured: true,
  },
  {
    id: '2',
    title: 'Customer Support Bot',
    description: '24/7 automated customer support agent with ticket management and smart routing.',
    price: 29,
    category: 'Customer Support',
    rating: 4.6,
    downloads: 8720,
    author: { name: 'SupportAI' },
    tags: ['support', 'tickets', 'chat'],
  },
  {
    id: '3',
    title: 'Data Analyst Agent',
    description: 'Analyze datasets, generate reports, and visualize insights automatically.',
    price: 49,
    category: 'Data Analysis',
    rating: 4.7,
    downloads: 5610,
    author: { name: 'DataForge' },
    tags: ['analytics', 'reports', 'visualization'],
  },
  {
    id: '4',
    title: 'Code Assistant',
    description: 'AI pair programmer that helps write, review, and debug code across languages.',
    price: 0,
    category: 'Code Generation',
    rating: 4.9,
    downloads: 21500,
    author: { name: 'DevAI' },
    tags: ['coding', 'debug', 'review'],
    featured: true,
  },
  {
    id: '5',
    title: 'Image Creator',
    description: 'Generate stunning images and artwork from text descriptions using advanced AI models.',
    price: 19,
    category: 'Image Generation',
    rating: 4.5,
    downloads: 15400,
    author: { name: 'PixelForge' },
    tags: ['images', 'art', 'design'],
  },
  {
    id: '6',
    title: 'Research Assistant',
    description: 'Conduct deep research, summarize papers, and extract key insights from any topic.',
    price: 39,
    category: 'Research',
    rating: 4.4,
    downloads: 4320,
    author: { name: 'DeepResearch' },
    tags: ['research', 'summarize', 'papers'],
  },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState('downloads');
  const [isLoading, setIsLoading] = useState(false);

  const filtered = mockListings
    .filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase()) ||
        l.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = category === 'All' || l.category === category;
      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'free' && l.price === 0) ||
        (priceFilter === 'paid' && l.price > 0);
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'downloads') return b.downloads - a.downloads;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price') return a.price - b.price;
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and install pre-built AI agents, tools, and workflows.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search marketplace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-3 w-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={priceFilter} onValueChange={(v) => setPriceFilter(v as typeof priceFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="free" className="gap-1">
                <Download className="h-3 w-3" /> Free
              </TabsTrigger>
              <TabsTrigger value="paid" className="gap-1">
                <Star className="h-3 w-3" /> Paid
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No listings found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
