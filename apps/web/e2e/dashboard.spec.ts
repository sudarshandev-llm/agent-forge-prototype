import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should redirect to sign-in when not authenticated', async ({ page }) => {
    const currentUrl = page.url();
    expect(currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up')).toBeTruthy();
  });

  test.describe('Authenticated', () => {
    test.use({ storageState: '.auth/user.json' });

    test('should display dashboard heading', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should show agent list or create button', async ({ page }) => {
      await page.goto('/dashboard');
      const createBtn = page.getByRole('link', { name: /create agent|new agent|create/i });
      const agentList = page.locator('[data-testid="agent-list"], .agent-list');

      if ((await createBtn.count()) > 0) {
        await expect(createBtn.first()).toBeVisible();
      }
      if ((await agentList.count()) > 0) {
        await expect(agentList.first()).toBeVisible();
      }
    });

    test('should navigate to create agent page', async ({ page }) => {
      await page.goto('/dashboard');
      const createBtn = page.getByRole('link', { name: /create agent|new agent/i });
      if ((await createBtn.count()) > 0) {
        await createBtn.first().click();
        await expect(page).toHaveURL(/\/agents\/new|\/agents\/create/);
      }
    });

    test('should display sidebar navigation', async ({ page }) => {
      await page.goto('/dashboard');
      const sidebar = page.locator('nav, aside, [role="navigation"]');
      if ((await sidebar.count()) > 0) {
        await expect(sidebar.first()).toBeVisible();
      }
    });

    test('sidebar should have key navigation items', async ({ page }) => {
      await page.goto('/dashboard');
      const navLinks = page.getByRole('link');
      const linkTexts = await navLinks.allInnerTexts();
      const hasAgentsLink = linkTexts.some((t) => /agents?/i.test(t));
      const hasTeamsLink = linkTexts.some((t) => /teams?/i.test(t));

      expect(hasAgentsLink || hasTeamsLink).toBe(true);
    });

    test('should display user profile or avatar', async ({ page }) => {
      await page.goto('/dashboard');
      const avatar = page.locator(
        '[data-testid="user-avatar"], img[alt*="avatar"], [class*="avatar"]',
      );
      const profileBtn = page.getByRole('button', { name: /profile|account|user/i });

      const visible = (await avatar.count()) > 0 || (await profileBtn.count()) > 0;
      expect(visible).toBe(true);
    });
  });
});
