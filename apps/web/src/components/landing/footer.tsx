import Link from 'next/link';
import { Bot } from 'lucide-react';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Documentation', 'API Reference', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Partners'],
  Resources: ['Community', 'Tutorials', 'Support', 'Status', 'Security'],
  Legal: ['Privacy', 'Terms', 'Cookie Policy', 'Licenses', 'GDPR'],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-4">
              <Bot className="h-6 w-6 text-primary" />
              <span>AgentForge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Build, deploy, and scale intelligent AI agents.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AgentForge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
