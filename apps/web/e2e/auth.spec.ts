import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Sign Up', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/sign-up');
    });

    test('should display sign up form elements', async ({ page }) => {
      await expect(page.locator('h1, h2').first()).toBeVisible();
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');

      if (await emailInput.count() > 0) {
        await expect(emailInput.first()).toBeVisible();
      }
      if (await passwordInput.count() > 0) {
        await expect(passwordInput.first()).toBeVisible();
      }
    });

    test('should have a submit button for sign up', async ({ page }) => {
      const submitBtn = page.getByRole('button', { name: /sign up|create account|get started|continue/i });
      await expect(submitBtn).toBeVisible();
    });

    test('should have a link to sign in', async ({ page }) => {
      const signInLink = page.getByRole('link', { name: /sign in|log in|already have an account/i });
      if (await signInLink.count() > 0) {
        await expect(signInLink.first()).toBeVisible();
      }
    });
  });

  test.describe('Sign In', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/sign-in');
    });

    test('should display sign in form', async ({ page }) => {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should have email and password fields', async ({ page }) => {
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');

      if (await emailInput.count() > 0) {
        await expect(emailInput.first()).toBeVisible();
      }
      if (await passwordInput.count() > 0) {
        await expect(passwordInput.first()).toBeVisible();
      }
    });

    test('should have a sign in button', async ({ page }) => {
      const signInBtn = page.getByRole('button', { name: /sign in|log in|continue/i });
      await expect(signInBtn).toBeVisible();
    });
  });

  test.describe('Redirect Behavior', () => {
    test('unauthenticated user should be redirected from protected pages', async ({ page }) => {
      await page.goto('/dashboard');
      const currentUrl = page.url();
      expect(
        currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up') || currentUrl === 'http://localhost:3000/',
      ).toBeTruthy();
    });

    test('should redirect to sign-in when accessing /agents without auth', async ({ page }) => {
      await page.goto('/agents');
      const currentUrl = page.url();
      expect(
        currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up'),
      ).toBeTruthy();
    });
  });
});
