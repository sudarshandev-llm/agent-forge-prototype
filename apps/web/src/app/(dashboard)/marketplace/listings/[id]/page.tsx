'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewList, type Review } from '@/components/marketplace/review-list';
import {
  ArrowLeft,
  Download,
  Star,
  DollarSign,
  ShoppingCart,
  Heart,
  Share2,
  Code,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { cn, formatNumber, getInitials, formatDate } from '@/lib/utils';

const mockListing = {
  id: '1',
  title: 'Content Writer Pro',
  description:
    'Generate high-quality blog posts, articles, and marketing copy with AI-powered content creation. This agent leverages GPT-4 and Claude to produce engaging, SEO-optimized content across dozens of formats.',
  longDescription: `Content Writer Pro is a state-of-the-art AI content creation agent designed for marketers, bloggers, and businesses who need high-quality written content at scale.

**Key Features**

- **Multi-format support** - Blog posts, articles, social media, emails, landing pages, and more
- **SEO optimization** - Built-in keyword research and content optimization
- **Brand voice customization** - Train the agent to match your brand's unique tone
- **Bulk generation** - Create multiple pieces of content simultaneously
- **Plagiarism checking** - Integrated originality verification`,
  price: 0,
  category: 'Content Writing',
  rating: 4.8,
  downloads: 12340,
  author: {
    name: 'AI Labs',
    avatar: '',
    bio: 'We build cutting-edge AI solutions for content creators and marketers.',
    verified: true,
  },
  tags: ['writing', 'blog', 'seo', 'content', 'marketing'],
  screenshots: [],
  version: '2.3.1',
  updatedAt: '2024-05-15T10:00:00Z',
  requirements: ['API Key required', 'Internet connection'],
  reviews: [
    {
      id: 'r1',
      userId: 'u1',
      userName: 'Sarah Johnson',
      rating: 5,
      comment:
        'Incredible tool! Cut our content creation time by 80%. The SEO features are game-changing.',
      createdAt: '2024-06-01T08:00:00Z',
    },
    {
      id: 'r2',
      userId: 'u2',
      userName: 'Mike Chen',
      rating: 4,
      comment: 'Very good overall. Sometimes needs manual editing but produces great drafts.',
      createdAt: '2024-05-28T14:30:00Z',
    },
    {
      id: 'r3',
      userId: 'u3',
      userName: 'Emily Davis',
      rating: 5,
      comment: 'Best content agent on the marketplace. The brand voice feature is incredible.',
      createdAt: '2024-05-20T11:15:00Z',
    },
  ] satisfies Review[],
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isInstalling, setIsInstalling] = useState(false);

  const listing = mockListing;
  const isInstalled = false;

  const handleInstall = async () => {
    setIsInstalling(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsInstalling(false);
  };

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/marketplace" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{listing.category}</Badge>
                  <Badge variant="success">Free</Badge>
                  {listing.author.verified && (
                    <Badge variant="outline" className="gap-1">
                      <Shield className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold">{listing.title}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{listing.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{listing.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">(128 reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download className="h-4 w-4" />
                {formatNumber(listing.downloads)} downloads
              </div>
              <div className="text-muted-foreground">Version {listing.version}</div>
              <div className="text-muted-foreground">
                Updated {formatDate(listing.updatedAt, 'relative')}
              </div>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews (128)</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                <Download className="h-16 w-16 text-muted-foreground/30" />
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3>Overview</h3>
                <p>{listing.longDescription}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <ul className="space-y-1">
                    {listing.requirements.map((req) => (
                      <li
                        key={req}
                        className="text-sm text-muted-foreground flex items-center gap-2"
                      >
                        <Shield className="h-3 w-3 text-muted-foreground/60" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {listing.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <ReviewList reviews={listing.reviews} />
            </TabsContent>

            <TabsContent value="versions" className="space-y-3">
              {['2.3.1', '2.3.0', '2.2.0', '2.1.0'].map((v) => (
                <div key={v} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Version {v}</p>
                    <p className="text-xs text-muted-foreground">
                      {v === '2.3.1' ? 'Current' : 'Outdated'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {v === '2.3.1' ? 'Installed' : 'Rollback'}
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-6 space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">Free</p>
              <p className="text-sm text-muted-foreground mt-1">MIT License</p>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleInstall}
              disabled={isInstalling || isInstalled}
            >
              {isInstalling ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isInstalling ? 'Installing...' : isInstalled ? 'Installed' : 'Install Agent'}
            </Button>

            <Button variant="outline" className="w-full gap-2" disabled>
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={listing.author.avatar} />
                  <AvatarFallback>{getInitials(listing.author.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{listing.author.name}</p>
                  <p className="text-xs text-muted-foreground">Publisher</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{listing.author.bio}</p>
              <Button variant="outline" size="sm" className="w-full">
                View Profile
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">License</span>
                <span>MIT</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(listing.updatedAt, 'relative')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span>{listing.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
