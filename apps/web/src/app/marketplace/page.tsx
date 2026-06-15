'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListingCard, type Listing } from '@/components/marketplace/listing-card';
import { Search, Download, Star, ArrowUpDown, Store, Sparkles } from 'lucide-react';

const categories = ['All', 'Agents', 'Tools', 'Templates', 'Workflows'];

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
];

const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Customer Support Agent',
    description: 'AI-powered customer support agent with ticket management and smart routing.',
    price: 0,
    category: 'Agents',
    rating: 4.8,
    downloads: 12340,
    author: { name: 'AI Labs' },
    tags: ['support', 'tickets', 'chat'],
    featured: true,
  },
  {
    id: '2',
    title: 'Web Search Tool',
    description: 'Real-time web search and content extraction tool.',
    price: 0,
    category: 'Tools',
    rating: 4.6,
    downloads: 8720,
    author: { name: 'DataForge' },
    tags: ['search', 'web', 'scraping'],
  },
  {
    id: '3',
    title: 'Code Review Workflow',
    description: 'Automated code review workflow with multi-model analysis.',
    price: 29,
    category: 'Workflows',
    rating: 4.7,
    downloads: 5610,
    author: { name: 'DevAI' },
    tags: ['code', 'review', 'github'],
  },
  {
    id: '4',
    title: 'Data Analyst Agent',
    description: 'Analyze datasets, generate reports, and visualize insights.',
    price: 49,
    category: 'Agents',
    rating: 4.9,
    downloads: 21500,
    author: { name: 'DataForge' },
    tags: ['analytics', 'reports', 'visualization'],
    featured: true,
  },
  {
    id: '5',
    title: 'Email Template Pack',
    description: 'Professional email templates for customer communications.',
    price: 0,
    category: 'Templates',
    rating: 4.5,
    downloads: 15400,
    author: { name: 'ContentLab' },
    tags: ['email', 'templates', 'marketing'],
  },
  {
    id: '6',
    title: 'Research Assistant Agent',
    description: 'Deep research agent that summarizes papers and extracts insights.',
    price: 39,
    category: 'Agents',
    rating: 4.4,
    downloads: 4320,
    author: { name: 'DeepResearch' },
    tags: ['research', 'summarize', 'papers'],
  },
  {
    id: '7',
    title: 'HTTP Request Tool',
    description: 'Make HTTP requests to any API with authentication support.',
    price: 0,
    category: 'Tools',
    rating: 4.7,
    downloads: 9800,
    author: { name: 'APIConnect' },
    tags: ['http', 'api', 'rest'],
  },
  {
    id: '8',
    title: 'Content Generation Template',
    description: 'Template for AI-powered content generation workflows.',
    price: 19,
    category: 'Templates',
    rating: 4.3,
    downloads: 3210,
    author: { name: 'ContentLab' },
    tags: ['content', 'writing', 'template'],
  },
  {
    id: '9',
    title: 'Deployment Pipeline',
    description: 'Automated CI/CD deployment workflow with approval gates.',
    price: 99,
    category: 'Workflows',
    rating: 4.8,
    downloads: 2150,
    author: { name: 'DevOpsAI' },
    tags: ['deployment', 'ci-cd', 'devops'],
    featured: true,
  },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState('popular');

  const filtered = useMemo(() => {
    return mockListings
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
        if (sortBy === 'popular') return b.downloads - a.downloads;
        if (sortBy === 'newest') return 0;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }, [search, category, priceFilter, sortBy]);

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Store className="h-6 w-6 text-primary" />
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Marketplace</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Discover and install pre-built AI agents, tools, workflows, and templates.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search marketplace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
          <div className="flex items-center gap-2">
            <Tabs
              value={priceFilter}
              onValueChange={(v) => setPriceFilter(v as typeof priceFilter)}
            >
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
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
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
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
