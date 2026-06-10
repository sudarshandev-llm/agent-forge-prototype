import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-8 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
          <Bot className="mr-2 h-4 w-4 text-primary" />
          <span>Build, deploy, and scale AI agents</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Build Intelligent
          <span className="block text-primary">AI Agents</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
          Create, deploy, and manage AI agents with ease. Build custom workflows, integrate powerful tools,
          and orchestrate multi-agent teams—all from a single platform.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" size="lg">
              Watch Demo
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">No credit card required. Free tier included.</p>
      </div>
    </section>
  );
}
