'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, Bot, Minus } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Up to 3 agents',
      'Basic agent templates',
      '100 API calls/month',
      'Community support',
      '1 workflow',
    ],
    notIncluded: [],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For individual developers',
    price: { monthly: 29, yearly: 290 },
    features: [
      'Up to 20 agents',
      'All agent templates',
      '10,000 API calls/month',
      'Priority support',
      'Unlimited workflows',
      'Custom tools integration',
      'Advanced analytics',
      'Team collaboration',
    ],
    notIncluded: [],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For organizations',
    price: { monthly: 99, yearly: 990 },
    features: [
      'Unlimited agents',
      'All templates & premium',
      '100,000 API calls/month',
      'Dedicated support',
      'Unlimited workflows',
      'Custom tools integration',
      'Advanced analytics',
      'Team collaboration',
      'SSO & SAML',
      'Audit logs',
      'Custom integrations',
      'SLA guarantee',
    ],
    notIncluded: [],
    cta: 'Contact Sales',
    popular: false,
  },
];

const comparisons = [
  { feature: 'AI Agents', free: '3', pro: '20', enterprise: 'Unlimited' },
  { feature: 'Templates', free: 'Basic', pro: 'All', enterprise: 'All + Premium' },
  { feature: 'API Calls / Month', free: '100', pro: '10,000', enterprise: '100,000' },
  { feature: 'Workflows', free: '1', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Team Members', free: '1', pro: '5', enterprise: 'Unlimited' },
  { feature: 'Custom Tools', free: <Minus className="h-4 w-4 mx-auto" />, pro: <Check className="h-4 w-4 mx-auto text-green-500" />, enterprise: <Check className="h-4 w-4 mx-auto text-green-500" /> },
  { feature: 'Analytics', free: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
  { feature: 'Support', free: 'Community', pro: 'Priority', enterprise: 'Dedicated' },
  { feature: 'SSO / SAML', free: <Minus className="h-4 w-4 mx-auto" />, pro: <Minus className="h-4 w-4 mx-auto" />, enterprise: <Check className="h-4 w-4 mx-auto text-green-500" /> },
  { feature: 'Audit Logs', free: <Minus className="h-4 w-4 mx-auto" />, pro: <Minus className="h-4 w-4 mx-auto" />, enterprise: <Check className="h-4 w-4 mx-auto text-green-500" /> },
  { feature: 'SLA', free: <Minus className="h-4 w-4 mx-auto" />, pro: <Minus className="h-4 w-4 mx-auto" />, enterprise: <Check className="h-4 w-4 mx-auto text-green-500" /> },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Bot className="h-6 w-6 text-primary" />
            <span>AgentForge</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>

          <div className="inline-flex items-center gap-3 rounded-full border p-1 mt-4">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                !annual && 'bg-primary text-primary-foreground',
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                annual && 'bg-primary text-primary-foreground',
              )}
            >
              Annual
              <span className="ml-1.5 text-xs opacity-80">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-primary shadow-lg scale-105',
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${annual ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    /{annual ? 'year' : 'month'}
                  </span>
                  {plan.price.monthly === 0 && (
                    <span className="text-muted-foreground ml-1">forever</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.name === 'Enterprise' ? '/contact' : '/sign-up'}>
                    {plan.cta}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center mb-8">Compare plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 font-medium">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-primary">Pro</th>
                  <th className="text-center py-3 px-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row) => (
                  <tr key={row.feature} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-sm text-center text-muted-foreground">{row.free}</td>
                    <td className="py-3 px-4 text-sm text-center">{row.pro}</td>
                    <td className="py-3 px-4 text-sm text-center">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-2xl font-bold mb-4">Need a custom plan?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Contact our sales team for custom pricing, dedicated infrastructure, and enterprise-grade support.
          </p>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
