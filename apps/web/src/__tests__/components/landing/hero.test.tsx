import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/landing/hero';

describe('Hero', () => {
  it('renders the main heading', () => {
    render(<Hero />);
    expect(screen.getByText('Build Intelligent')).toBeInTheDocument();
  });

  it('renders the AI Agents highlight text', () => {
    render(<Hero />);
    expect(screen.getByText('AI Agents')).toBeInTheDocument();
  });

  it('renders the description paragraph', () => {
    render(<Hero />);
    expect(screen.getByText(/Create, deploy, and manage AI agents with ease/i)).toBeInTheDocument();
  });

  it('renders the badge with build text', () => {
    render(<Hero />);
    expect(screen.getByText('Build, deploy, and scale AI agents')).toBeInTheDocument();
  });

  it('renders the Get Started Free button with link', () => {
    render(<Hero />);
    const button = screen.getByRole('link', { name: /get started free/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/sign-up');
  });

  it('renders the Watch Demo button with link', () => {
    render(<Hero />);
    const button = screen.getByRole('link', { name: /watch demo/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/demo');
  });

  it('renders the no credit card disclaimer', () => {
    render(<Hero />);
    expect(screen.getByText(/No credit card required/i)).toBeInTheDocument();
  });

  it('renders the Bot icon', () => {
    render(<Hero />);
    const badge = screen.getByText('Build, deploy, and scale AI agents').closest('div');
    expect(badge?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the ArrowRight icon on CTA button', () => {
    render(<Hero />);
    const ctaLink = screen.getByRole('link', { name: /get started free/i });
    expect(ctaLink.querySelector('svg')).toBeInTheDocument();
  });
});
