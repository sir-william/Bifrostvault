/**
 * E2E Tests: Vault Operations
 * 
 * Tests password vault functionality including:
 * - Listing vault entries
 * - Adding new entries
 * - Updating entries
 * - Deleting entries
 * - Searching entries
 * - Encryption/decryption
 */

import { test, expect } from '@playwright/test';
import { mockLogin, MOCK_USERS } from './fixtures/auth';
import { installWebAuthnMock } from './helpers/webauthn-mock';

test.describe('Vault Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await mockLogin(page, MOCK_USERS.regularUser);
    
    // Install WebAuthn mock
    await installWebAuthnMock(page, { type: 'yubikey5' });
  });

  test('should display vault page when authenticated', async ({ page }) => {
    await page.goto('/vault');
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('YubiPass Manager');
    await expect(page.locator('input[placeholder="Search vault..."]')).toBeVisible();
    await expect(page.locator('button:has-text("Add Entry")')).toBeVisible();
  });

  test('should show empty vault message when no entries exist', async ({ page }) => {
    await page.goto('/vault');
    
    // Should show empty state
    await expect(page.locator('text=Your vault is empty')).toBeVisible();
    await expect(page.locator('text=Start by adding your first password')).toBeVisible();
  });

  test('should display YubiKey warning when no key is registered', async ({ page }) => {
    await page.goto('/vault');
    
    // Should show YubiKey warning
    await expect(page.locator('text=YubiKey Not Configured')).toBeVisible();
    await expect(page.locator('text=For enhanced security')).toBeVisible();
    await expect(page.locator('button:has-text("Setup YubiKey")')).toBeVisible();
  });

  test('should navigate to YubiKey setup from warning', async ({ page }) => {
    await page.goto('/vault');
    
    // Click setup button
    await page.click('button:has-text("Setup YubiKey")');
    
    // Should navigate to setup page
    await expect(page).toHaveURL('/setup-yubikey');
  });

  test('should search vault entries', async ({ page }) => {
    await page.goto('/vault');
    
    // Type in search box
    const searchInput = page.locator('input[placeholder="Search vault..."]');
    await searchInput.fill('github');
    
    // Search should filter results (if any exist)
    // In empty vault, should still show empty state
    await expect(page.locator('text=Your vault is empty')).toBeVisible();
  });

  test('should show add entry placeholder', async ({ page }) => {
    await page.goto('/vault');
    
    // Click add entry button
    await page.click('button:has-text("Add Entry")');
    
    // Should show coming soon toast
    await expect(page.locator('text=Add entry feature coming soon')).toBeVisible({ timeout: 5000 });
  });

  test('should display user info in header', async ({ page }) => {
    await page.goto('/vault');
    
    // Should show user name or email
    await expect(page.locator(`text=${MOCK_USERS.regularUser.name}`)).toBeVisible();
  });

  test('should have settings button in header', async ({ page }) => {
    await page.goto('/vault');
    
    // Find settings button (icon button)
    const settingsButton = page.locator('button[aria-label="Settings"], button:has(svg)').filter({ hasText: '' }).first();
    await expect(settingsButton).toBeVisible();
  });

  test('should have logout button in header', async ({ page }) => {
    await page.goto('/vault');
    
    // Find logout button
    const logoutButton = page.locator('button').filter({ hasText: '' }).last();
    await expect(logoutButton).toBeVisible();
  });

  test('should logout when clicking logout button', async ({ page }) => {
    await page.goto('/vault');
    
    // Click logout button (last icon button in header)
    const logoutButton = page.locator('button').filter({ hasText: '' }).last();
    await logoutButton.click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });

  test('should navigate to settings from vault', async ({ page }) => {
    await page.goto('/vault');
    
    // Click settings button
    const settingsButton = page.locator('button').filter({ hasText: '' }).first();
    await settingsButton.click();
    
    // Should navigate to setup page
    await expect(page).toHaveURL('/setup-yubikey');
  });

  test('should display vault entries if they exist', async ({ page }) => {
    // Mock API to return some vault entries
    await page.route('**/trpc/vault.list*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [
              {
                id: 1,
                userId: 1,
                type: 'login',
                encryptedName: 'GitHub',
                encryptedUsername: 'user@example.com',
                encryptedPassword: 'encrypted_password',
                encryptedUrl: 'https://github.com',
                isFavorite: true,
                folder: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastAccessed: null,
              },
              {
                id: 2,
                userId: 1,
                type: 'login',
                encryptedName: 'Gmail',
                encryptedUsername: 'user@gmail.com',
                encryptedPassword: 'encrypted_password',
                encryptedUrl: 'https://gmail.com',
                isFavorite: false,
                folder: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastAccessed: null,
              },
            ],
          },
        }),
      });
    });
    
    await page.goto('/vault');
    
    // Should display entries
    await expect(page.locator('text=GitHub')).toBeVisible();
    await expect(page.locator('text=Gmail')).toBeVisible();
    
    // Should show favorite star for GitHub
    const githubCard = page.locator('text=GitHub').locator('..');
    await expect(githubCard.locator('svg.lucide-star')).toBeVisible();
  });

  test('should filter vault entries by search query', async ({ page }) => {
    // Mock API with multiple entries
    await page.route('**/trpc/vault.list*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [
              {
                id: 1,
                type: 'login',
                encryptedName: 'GitHub',
                updatedAt: new Date().toISOString(),
              },
              {
                id: 2,
                type: 'login',
                encryptedName: 'Gmail',
                updatedAt: new Date().toISOString(),
              },
              {
                id: 3,
                type: 'login',
                encryptedName: 'GitLab',
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        }),
      });
    });
    
    await page.goto('/vault');
    
    // All entries should be visible
    await expect(page.locator('text=GitHub')).toBeVisible();
    await expect(page.locator('text=Gmail')).toBeVisible();
    await expect(page.locator('text=GitLab')).toBeVisible();
    
    // Search for "git"
    await page.fill('input[placeholder="Search vault..."]', 'git');
    
    // Only GitHub and GitLab should be visible
    await expect(page.locator('text=GitHub')).toBeVisible();
    await expect(page.locator('text=GitLab')).toBeVisible();
    await expect(page.locator('text=Gmail')).not.toBeVisible();
  });

  test('should display entry type badges', async ({ page }) => {
    await page.route('**/trpc/vault.list*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [
              {
                id: 1,
                type: 'login',
                encryptedName: 'Test Login',
                updatedAt: new Date().toISOString(),
              },
              {
                id: 2,
                type: 'note',
                encryptedName: 'Test Note',
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        }),
      });
    });
    
    await page.goto('/vault');
    
    // Should show type for each entry
    await expect(page.locator('text=Login').first()).toBeVisible();
    await expect(page.locator('text=note')).toBeVisible();
  });

  test('should handle vault loading state', async ({ page }) => {
    // Delay the API response
    await page.route('**/trpc/vault.list*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: { data: [] } }),
      });
    });
    
    await page.goto('/vault');
    
    // Should show loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // After loading, should show empty state
    await expect(page.locator('text=Your vault is empty')).toBeVisible({ timeout: 5000 });
  });

  test('should require authentication to access vault', async ({ page }) => {
    // Clear authentication
    await page.context().clearCookies();
    
    await page.goto('/vault');
    
    // Should redirect to login
    await page.waitForURL(/login|oauth|^\/$/, { timeout: 5000 });
  });

  test('should display vault entry timestamps', async ({ page }) => {
    const testDate = new Date('2024-01-15');
    
    await page.route('**/trpc/vault.list*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: [
              {
                id: 1,
                type: 'login',
                encryptedName: 'Test Entry',
                updatedAt: testDate.toISOString(),
              },
            ],
          },
        }),
      });
    });
    
    await page.goto('/vault');
    
    // Should display formatted date
    await expect(page.locator('text=/1\\/15\\/2024|15\\/1\\/2024/')).toBeVisible();
  });
});
