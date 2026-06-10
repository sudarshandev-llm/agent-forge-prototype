'use client';

import { SignUp } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { Bot } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Bot className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">AgentForge</span>
      </Link>
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto w-full max-w-md',
            card: 'shadow-lg border',
            headerTitle: 'text-2xl font-bold',
            headerSubtitle: 'text-muted-foreground',
            formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            formFieldInput: 'border-input bg-background',
            footerActionLink: 'text-primary hover:text-primary/80',
          },
        }}
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
