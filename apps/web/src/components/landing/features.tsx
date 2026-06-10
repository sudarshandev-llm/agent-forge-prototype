import { Bot, Workflow, Puzzle, Shield, Brain, GitBranch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Bot,
    title: 'AI Agent Builder',
    description: 'Create custom AI agents with configurable models, system prompts, and capabilities.',
  },
  {
    icon: Workflow,
    title: 'Visual Workflows',
    description: 'Design complex multi-step workflows with a drag-and-drop visual editor.',
  },
  {
    icon: Puzzle,
    title: 'Tool Integration',
    description: 'Connect your agents to APIs, databases, and external services seamlessly.',
  },
  {
    icon: Brain,
    title: 'Multi-LLM Support',
    description: 'Use OpenAI, Anthropic, Ollama, and more with a unified interface.',
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description: 'Track changes, fork agents, and collaborate with your team.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Role-based access control, audit logging, and SOC 2 compliance.',
  },
];

export function Features() {
  return (
    <section className="px-6 py-24 sm:py-32 lg:px-8" id="features">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to build AI agents
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features designed for developers and teams.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 bg-muted/50">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
