import { test, expect } from '@playwright/test';

test('auth screen renders core elements on mobile viewport', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('ATMOS')).toBeVisible();
  await expect(page.getByText('Sign in to continue your climate journey')).toBeVisible();
  await expect(page.getByPlaceholder('98765 43210')).toBeVisible();
  await expect(page.getByText('Send OTP')).toBeVisible();
});

test('country picker and social login CTAs are visible', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('+91')).toBeVisible();
  await expect(page.getByText('Google')).toBeVisible();
  await expect(page.getByText('Apple')).toBeVisible();
});
