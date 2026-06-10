'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, Menu, Bot, ChevronRight, Book, Code, Cpu, Workflow, Puzzle, Key, Globe, ChevronDown } from 'lucide-react';

interface DocSection {
  id: string;
  label: string;
  icon: typeof Book;
  children?: { id: string; label: string }[];
}

const docSections: DocSection[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: Book,
    children: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quickstart', label: 'Quickstart Guide' },
      { id: 'installation', label: 'Installation' },
      { id: 'concepts', label: 'Core Concepts' },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot,
    children: [
      { id: 'creating-agents', label: 'Creating Agents' },
      { id: 'configuration', label: 'Configuration' },
      { id: 'capabilities', label: 'Capabilities' },
      { id: 'templates', label: 'Templates' },
    ],
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: Workflow,
    children: [
      { id: 'workflow-basics', label: 'Workflow Basics' },
      { id: 'node-types', label: 'Node Types' },
      { id: 'triggers', label: 'Triggers' },
      { id: 'conditions', label: 'Conditions' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools & Integrations',
    icon: Puzzle,
    children: [
      { id: 'built-in-tools', label: 'Built-in Tools' },
      { id: 'custom-tools', label: 'Custom Tools' },
      { id: 'api-integration', label: 'API Integration' },
    ],
  },
  {
    id: 'api',
    label: 'API Reference',
    icon: Code,
    children: [
      { id: 'rest-api', label: 'REST API' },
      { id: 'authentication', label: 'Authentication' },
      { id: 'endpoints', label: 'Endpoints' },
      { id: 'rate-limits', label: 'Rate Limits' },
    ],
  },
  {
    id: 'deployment',
    label: 'Deployment',
    icon: Globe,
    children: [
      { id: 'self-hosting', label: 'Self-Hosting' },
      { id: 'cloud', label: 'Cloud Deployment' },
      { id: 'environment', label: 'Environment Variables' },
      { id: 'monitoring', label: 'Monitoring' },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Cpu,
    children: [
      { id: 'custom-models', label: 'Custom Models' },
      { id: 'multi-agent', label: 'Multi-Agent Systems' },
      { id: 'performance', label: 'Performance Tuning' },
      { id: 'security', label: 'Security' },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['getting-started']),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const content = {
    introduction: {
      title: 'Introduction',
      body: `Welcome to AgentForge, the open-source platform for building, deploying, and managing intelligent AI agents.

AgentForge provides a comprehensive toolkit for creating AI-powered automation. Whether you're building a simple chatbot or a complex multi-agent system, AgentForge gives you the infrastructure you need.

**What is AgentForge?**

AgentForge is a full-stack platform that enables developers and organizations to:

- **Create AI Agents** - Build custom agents with specific capabilities and behaviors
- **Design Workflows** - Create visual workflows that chain together agent actions, conditions, and tool calls
- **Integrate Tools** - Connect your agents to external APIs, databases, and services
- **Collaborate in Teams** - Combine multiple agents to solve complex tasks
- **Deploy at Scale** - Run your agents in production with monitoring and analytics

**Key Features**

- Visual workflow builder with drag-and-drop interface
- Multi-model support (GPT-4, Claude, Llama, and more)
- Built-in tool integrations (Slack, GitHub, Notion, etc.)
- Real-time execution monitoring
- Team collaboration and role-based access
- Comprehensive API and SDK
- Self-hostable or cloud-managed`,
    },
    quickstart: {
      title: 'Quickstart Guide',
      body: `Get up and running with AgentForge in minutes.

**1. Create an Account**

Sign up at app.agentforge.ai or self-host your own instance.

**2. Create Your First Agent**

Navigate to the Agents section and click "New Agent". Choose a template or start from scratch.

**3. Configure Your Agent**

Give your agent a name, description, and select the AI model it will use.

**4. Add Capabilities**

Define what your agent can do by adding capabilities like web search, data analysis, or custom tools.

**5. Test Your Agent**

Use the built-in chat interface to test your agent's responses and behavior.

**6. Deploy**

Once your agent is ready, deploy it to production. You'll get an API endpoint you can integrate with any application.`,
    },
    'workflow-basics': {
      title: 'Workflow Basics',
      body: `Workflows in AgentForge allow you to create complex automation sequences by connecting different nodes in a visual editor.

**What is a Workflow?**

A workflow is a series of connected steps (nodes) that execute in sequence. Each node performs a specific action, such as running an agent, making a decision, or calling an external tool.

**Workflow Nodes**

- **Start** - Triggers the workflow (manual, schedule, webhook, or event)
- **Agent Action** - Runs an AI agent with specific input
- **Condition** - Branches execution based on logical conditions
- **Tool Call** - Executes an external tool or API
- **End** - Completes the workflow

**Building a Workflow**

1. Drag nodes from the palette onto the canvas
2. Configure each node's properties
3. Connect nodes to define the execution flow
4. Test your workflow with sample data
5. Deploy and monitor execution`,
    },
  };

  const getActiveContent = () => {
    for (const section of docSections) {
      if (section.children) {
        for (const child of section.children) {
          if (child.id === activeSection) {
            return content[child.id as keyof typeof content] || {
              title: child.label,
              body: 'Documentation content coming soon.',
            };
          }
        }
      }
    }
    return content.introduction;
  };

  const activeContent = getActiveContent();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Bot className="h-6 w-6 text-primary" />
            <span>AgentForge</span>
          </Link>
          <span className="text-sm text-muted-foreground border-l pl-4 ml-2">Docs</span>
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

      <div className="mx-auto max-w-7xl flex">
        <aside
          className={cn(
            'fixed inset-y-14 left-0 z-40 w-64 shrink-0 border-r bg-background transition-transform lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)]',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
        >
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search docs..." className="pl-9 h-9 text-sm" />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-8rem)] px-3">
            <nav className="space-y-1 pb-6">
              {docSections.map((section) => {
                const Icon = section.icon;
                const isExpanded = expandedSections.has(section.id);
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{section.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 text-muted-foreground transition-transform',
                          isExpanded && 'rotate-180',
                        )}
                      />
                    </button>
                    {isExpanded && section.children && (
                      <div className="ml-2 mt-0.5 space-y-0.5 border-l pl-3">
                        {section.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => {
                              setActiveSection(child.id);
                              setSidebarOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
                              activeSection === child.id
                                ? 'bg-accent text-accent-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                            )}
                          >
                            <ChevronRight className="h-3 w-3 shrink-0" />
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 px-4 py-8 lg:px-8 lg:py-12 max-w-4xl">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold tracking-tight">{activeContent.title}</h1>
            <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {activeContent.body}
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between border-t pt-6">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
