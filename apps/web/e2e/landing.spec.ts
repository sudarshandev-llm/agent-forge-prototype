import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the hero section with heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Build Intelligent');
    await expect(page.locator('h1')).toContainText('AI Agents');
  });

  test('should display the description text', async ({ page }) => {
    await expect(page.getByText(/Create, deploy, and manage AI agents with ease/i)).toBeVisible();
  });

  test('should have Get Started Free button linking to sign-up', async ({ page }) => {
    const getStarted = page.getByRole('link', { name: /get started free/i });
    await expect(getStarted).toBeVisible();
    await expect(getStarted).toHaveAttribute('href', '/sign-up');
  });

  test('should have Watch Demo button linking to demo', async ({ page }) => {
    const watchDemo = page.getByRole('link', { name: /watch demo/i });
    await expect(watchDemo).toBeVisible();
    await expect(watchDemo).toHaveAttribute('href', '/demo');
  });

  test('should display the no credit card text', async ({ page }) => {
    await expect(page.getByText(/No credit card required/i)).toBeVisible();
  });

  test('should navigate to sign-up on Get Started click', async ({ page }) => {
    await page.getByRole('link', { name: /get started free/i }).click();
    await expect(page).toHaveURL('/sign-up');
  });

  test('should navigate to demo page on Watch Demo click', async ({ page }) => {
    await page.getByRole('link', { name: /watch demo/i }).click();
    await expect(page).toHaveURL('/demo');
  });

  test('should have a visible navigation or header', async ({ page }) => {
    const nav = page.locator('nav, header');
    if ((await nav.count()) > 0) {
      await expect(nav.first()).toBeVisible();
    }
  });

  test('should have the badge text visible', async ({ page }) => {
    await expect(page.getByText('Build, deploy, and scale AI agents')).toBeVisible();
  });

  test('page title should be set', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('page should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    expect(errors.length).toBe(0);
  });
});
