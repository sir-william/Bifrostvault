/**
 * Authentication Fixtures for E2E Tests
 * 
 * Provides reusable authentication helpers and mock user data
 */

import { Page } from '@playwright/test';

export interface MockUser {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export const MOCK_USERS = {
  regularUser: {
    id: 1,
    openId: 'test-user-001',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user' as const,
  },
  adminUser: {
    id: 2,
    openId: 'admin-user-001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin' as const,
  },
};

/**
 * Mock OAuth login by setting session cookie
 */
export async function mockLogin(page: Page, user: MockUser = MOCK_USERS.regularUser) {
  await page.context().addCookies([
    {
      name: 'session',
      value: `mock-session-${user.openId}`,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Inject user data into page context
  await page.addInitScript((userData) => {
    (window as any).__MOCK_USER__ = userData;
  }, user);
}

/**
 * Mock logout by clearing session cookie
 */
export async function mockLogout(page: Page) {
  await page.context().clearCookies();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(cookie => cookie.name === 'session');
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout: number = 5000) {
  await page.waitForFunction(
    () => {
      const user = (window as any).__MOCK_USER__;
      return user !== undefined;
    },
    { timeout }
  );
}

/**
 * Get current user from page context
 */
export async function getCurrentUser(page: Page): Promise<MockUser | null> {
  return await page.evaluate(() => {
    return (window as any).__MOCK_USER__ || null;
  });
}
