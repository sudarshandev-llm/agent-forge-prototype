import { Card, CardContent } from '@/components/ui/card';
import { Play, Code, MessageSquare, ArrowRight, Puzzle } from 'lucide-react';

export function Demo() {
  return (
    <section className="px-6 py-24 sm:py-32 lg:px-8 bg-muted/30" id="demo">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See it in action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Create an agent, configure tools, and run it in seconds.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="border-0">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">1. Configure</h3>
              <p className="text-sm text-muted-foreground">
                Choose your LLM provider, set parameters, and define system prompts.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Puzzle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">2. Connect Tools</h3>
              <p className="text-sm text-muted-foreground">
                Attach tools like web search, API calls, or custom functions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">3. Execute</h3>
              <p className="text-sm text-muted-foreground">
                Run your agent and watch it reason, use tools, and deliver results.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 rounded-xl border bg-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Agent Running</span>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-2">User input:</p>
              <p className="font-medium">Research the latest developments in quantum computing</p>
            </div>
            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
              <p className="text-sm text-muted-foreground mb-2">Agent response:</p>
              <p className="leading-relaxed">
                I found several recent developments in quantum computing. IBM announced their
                1,000+ qubit processor, while Google demonstrated quantum error correction at scale.
                The field is advancing rapidly with significant investments from both private and
                public sectors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
