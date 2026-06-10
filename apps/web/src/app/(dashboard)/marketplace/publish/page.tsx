'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import Link from 'next/link';

const categories = [
  'Content Writing',
  'Customer Support',
  'Data Analysis',
  'Code Generation',
  'Image Generation',
  'Research',
  'Automation',
  'Translation',
  'Other',
];

const publishSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500),
  category: z.string().min(1, 'Please select a category'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  tags: z.array(z.string()).min(1, 'Add at least one tag'),
  license: z.string().min(1, 'Please select a license'),
  version: z.string().min(1, 'Version is required'),
});

type PublishForm = z.infer<typeof publishSchema>;

export default function PublishPage() {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PublishForm>({
    resolver: zodResolver(publishSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price: 0,
      tags: [],
      license: 'mit',
      version: '1.0.0',
    },
  });

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = async (data: PublishForm) => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      toast.success('Listing published successfully!');
      router.push('/marketplace');
    } catch {
      toast.error('Failed to publish listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/marketplace" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Publish Listing</h1>
        <p className="text-muted-foreground">
          Share your agent, tool, or workflow with the community.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Provide the core details about your listing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Content Writer Pro"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe what your listing does and its key features..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(v) => setValue('category', v)}
                  defaultValue=""
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  Price ($) <span className="text-muted-foreground font-normal">(0 = free)</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.99}
                  {...register('price')}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media & Tags</CardTitle>
            <CardDescription>Add screenshots and categorize your listing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Screenshots</Label>
              <div className="grid grid-cols-4 gap-3">
                {screenshots.map((src, i) => (
                  <div key={i} className="relative aspect-video rounded-md bg-muted">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full"
                      onClick={() => setScreenshots((s) => s.filter((_, j) => j !== i))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {screenshots.length < 4 && (
                  <label className="flex aspect-video cursor-pointer items-center justify-center rounded-md border border-dashed hover:bg-accent/50 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <input type="file" className="sr-only" accept="image/*" />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.tags && (
                <p className="text-sm text-destructive">{errors.tags.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Version & License</CardTitle>
            <CardDescription>Set versioning and licensing information.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="1.0.0"
                {...register('version')}
              />
              {errors.version && (
                <p className="text-sm text-destructive">{errors.version.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">License</Label>
              <Select
                onValueChange={(v) => setValue('license', v)}
                defaultValue="mit"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select license" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mit">MIT</SelectItem>
                  <SelectItem value="apache-2.0">Apache 2.0</SelectItem>
                  <SelectItem value="gpl-3.0">GPL 3.0</SelectItem>
                  <SelectItem value="bsd-3">BSD 3-Clause</SelectItem>
                  <SelectItem value="proprietary">Proprietary</SelectItem>
                </SelectContent>
              </Select>
              {errors.license && (
                <p className="text-sm text-destructive">{errors.license.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </Button>
        </div>
      </form>
    </div>
  );
}
