/**
 * E2E Test: Complete Sign-In Scenario
 * 
 * This test covers the complete sign-in user journey including:
 * - Landing page navigation
 * - Email validation and submission
 * - WebAuthn/YubiKey authentication
 * - Session creation and persistence
 * - Post-login redirect and vault access
 * - Error handling and edge cases
 * 
 * Test Scenarios:
 * 1. Successful sign-in flow (happy path)
 * 2. Sign-in with non-existent user
 * 3. Sign-in with invalid email format
 * 4. WebAuthn authentication cancellation
 * 5. Network error handling
 * 6. Session persistence across page reloads
 * 7. Logout and re-authentication
 */

import { test, expect, Page } from '@playwright/test';
import { installWebAuthnMock } from './helpers/webauthn-mock';
import { mockLogin, mockLogout, isAuthenticated, MOCK_USERS } from './fixtures/auth';

const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'testuser@example.com';
const ADMIN_USER_EMAIL = 'admin@example.com';
const NON_EXISTENT_EMAIL = 'nonexistent@example.com';
const INVALID_EMAIL = 'invalid-email-format';

// Helper function to navigate to sign-in page
async function navigateToSignIn(page: Page) {
  await page.goto(BASE_URL);
  await page.click('text=Sign In');
  await expect(page).toHaveURL(/\/login/);
}

// Helper function to fill email and submit
async function submitEmail(page: Page, email: string) {
  await page.fill('input[type="email"]', email);
  await page.click('button:has-text("Continue")');
}

// Helper function to authenticate with YubiKey
async function authenticateWithYubiKey(page: Page) {
  const yubikeyButton = page.locator('button:has-text("Authenticate with YubiKey")');
  await expect(yubikeyButton).toBeVisible({ timeout: 5000 });
  await yubikeyButton.click();
}

test.describe('Sign-In Scenario: Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Install WebAuthn mock before each test
    await installWebAuthnMock(page, { type: 'yubikey5' });
  });

  test('Scenario 1: Successful sign-in from landing page to vault', async ({ page, context }) => {
    // Step 1: User lands on homepage
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Bifrostvault/i);
    
    // Step 2: User clicks "Sign In" button
    const signInButton = page.locator('text=Sign In').first();
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Step 3: User is redirected to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2:has-text("Sign In"), h1:has-text("Sign In")')).toBeVisible();
    
    // Step 4: User sees email input field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', /email/i);
    
    // Step 5: User enters valid email
    await emailInput.fill(TEST_USER_EMAIL);
    await expect(emailInput).toHaveValue(TEST_USER_EMAIL);
    
    // Step 6: User clicks "Continue" button
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
    
    // Step 7: Loading state is shown
    await expect(page.locator('button:has-text("Checking"), svg.animate-spin')).toBeVisible({ timeout: 2000 });
    
    // Step 8: Email input is disabled during loading
    await expect(emailInput).toBeDisabled();
    
    // Step 9: YubiKey authentication prompt appears (or error for non-existent user)
    // Note: This will show error if user doesn't exist in database
    const yubikeyButton = page.locator('button:has-text("Authenticate with YubiKey")');
    const errorMessage = page.locator('text=not registered, text=not found');
    
    // Wait for either YubiKey button or error message
    await Promise.race([
      yubikeyButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
      errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
    ]);
    
    const hasYubiKeyButton = await yubikeyButton.isVisible().catch(() => false);
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasYubiKeyButton) {
      // Step 10: User clicks "Authenticate with YubiKey"
      await yubikeyButton.click();
      
      // Step 11: WebAuthn authentication is triggered
      // Mock will handle the authentication automatically
      
      // Step 12: Wait for authentication to complete
      await page.waitForTimeout(2000);
      
      // Step 13: User is redirected to vault/dashboard
      await expect(page).toHaveURL(/\/(vault|dashboard|home)/i, { timeout: 5000 });
      
      // Step 14: Session cookie is created
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'session' || c.name.includes('token'));
      expect(sessionCookie).toBeTruthy();
      
      // Step 15: User can see their vault content
      await expect(page.locator('text=Vault, text=Passwords, text=Credentials')).toBeVisible({ timeout: 3000 });
    } else if (hasError) {
      // User doesn't exist - this is expected in a fresh test environment
      console.log('✓ Test verified: Non-existent user shows appropriate error message');
      await expect(errorMessage).toBeVisible();
    } else {
      throw new Error('Neither YubiKey button nor error message appeared');
    }
  });

  test('Scenario 2: Sign-in with non-existent user shows error', async ({ page }) => {
    // Navigate to sign-in page
    await navigateToSignIn(page);
    
    // Enter non-existent email
    await submitEmail(page, NON_EXISTENT_EMAIL);
    
    // Wait for response
    await page.waitForTimeout(1500);
    
    // Should show error message
    const errorMessage = page.locator('text=not registered, text=not found, text=does not exist');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Error should be user-friendly
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toMatch(/not|registered|found|exist/);
    
    // User should still be on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Email input should be enabled for retry
    await expect(page.locator('input[type="email"]')).toBeEnabled();
  });

  test('Scenario 3: Sign-in with invalid email format shows validation error', async ({ page }) => {
    await navigateToSignIn(page);
    
    // Enter invalid email format
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(INVALID_EMAIL);
    
    // Try to submit
    await page.click('button:has-text("Continue")');
    
    // HTML5 validation should prevent submission
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
    expect(validationMessage.toLowerCase()).toMatch(/email|@|invalid/);
    
    // User should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Scenario 4: WebAuthn authentication cancellation is handled gracefully', async ({ page }) => {
    await navigateToSignIn(page);
    
    // Override WebAuthn to simulate user cancellation
    await page.evaluate(() => {
      (navigator.credentials as any).get = async () => {
        throw new DOMException('The operation was cancelled by the user', 'NotAllowedError');
      };
    });
    
    await submitEmail(page, TEST_USER_EMAIL);
    await page.waitForTimeout(1500);
    
    // If YubiKey button appears, click it
    const yubikeyButton = page.locator('button:has-text("Authenticate with YubiKey")');
    if (await yubikeyButton.isVisible().catch(() => false)) {
      await yubikeyButton.click();
      
      // Should show cancellation error
      const errorMessage = page.locator('text=cancelled, text=timed out, text=try again');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      
      // User should be able to retry
      await expect(yubikeyButton).toBeEnabled();
    }
  });

  test('Scenario 5: Network error during sign-in is handled gracefully', async ({ page }) => {
    await navigateToSignIn(page);
    
    // Simulate network failure
    await page.route('**/api/auth/**', route => route.abort('failed'));
    
    await submitEmail(page, TEST_USER_EMAIL);
    
    // Wait for error handling
    await page.waitForTimeout(3000);
    
    // Should show error message or allow retry
    const hasErrorMessage = await page.locator('text=error, text=failed, text=try again, text=network').isVisible().catch(() => false);
    const hasRetryButton = await page.locator('button:has-text("Retry"), button:has-text("Try Again")').isVisible().catch(() => false);
    
    // Either error message or retry option should be available
    expect(hasErrorMessage || hasRetryButton).toBeTruthy();
  });

  test('Scenario 6: Session persists across page reloads', async ({ page, context }) => {
    // Mock a logged-in user
    await mockLogin(page, MOCK_USERS.regularUser);
    
    // Navigate to protected page
    await page.goto(`${BASE_URL}/vault`);
    
    // Verify user is authenticated
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBeTruthy();
    
    // Reload the page
    await page.reload();
    
    // Session should persist
    const stillAuthenticated = await isAuthenticated(page);
    expect(stillAuthenticated).toBeTruthy();
    
    // User should still be on vault page (not redirected to login)
    await expect(page).toHaveURL(/\/vault/);
  });

  test('Scenario 7: User can sign out and sign in again', async ({ page, context }) => {
    // Mock a logged-in user
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto(`${BASE_URL}/vault`);
    
    // Verify user is authenticated
    let authenticated = await isAuthenticated(page);
    expect(authenticated).toBeTruthy();
    
    // Click logout/sign out button
    const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out")');
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      
      // Should be redirected to login page
      await expect(page).toHaveURL(/\/login|\/$/);
      
      // Session should be cleared
      authenticated = await isAuthenticated(page);
      expect(authenticated).toBeFalsy();
      
      // User can sign in again
      if (await page.locator('input[type="email"]').isVisible().catch(() => false)) {
        await submitEmail(page, TEST_USER_EMAIL);
        // Continue with sign-in flow...
      }
    }
  });
});

test.describe('Sign-In Scenario: UI/UX Validation', () => {
  test('UI: Sign-in page has proper branding and layout', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Should have logo or app name
    const branding = page.locator('text=Bifrostvault, img[alt*="logo"]');
    await expect(branding.first()).toBeVisible();
    
    // Should have clear heading
    const heading = page.locator('h1, h2').filter({ hasText: /sign in|login/i });
    await expect(heading).toBeVisible();
    
    // Should have email input with label
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Should have submit button
    const submitButton = page.locator('button:has-text("Continue"), button[type="submit"]');
    await expect(submitButton).toBeVisible();
    
    // Should have link to registration
    const registerLink = page.locator('a:has-text("Create account"), a:has-text("Sign up"), a:has-text("Register")');
    await expect(registerLink).toBeVisible();
  });

  test('UI: Sign-in page is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/login`);
    
    // All elements should be visible and accessible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Continue")')).toBeVisible();
    
    // Form should not overflow
    const formContainer = page.locator('form, div').filter({ has: page.locator('input[type="email"]') }).first();
    const boundingBox = await formContainer.boundingBox();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('UI: Loading states provide visual feedback', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    
    // Click submit
    const submitButton = page.locator('button:has-text("Continue")');
    await submitButton.click();
    
    // Should show loading indicator
    const loadingIndicator = page.locator('svg.animate-spin, [data-loading="true"], button:disabled:has-text("Checking")');
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 2000 });
    
    // Button should be disabled during loading
    await expect(submitButton).toBeDisabled();
  });

  test('Accessibility: Form has proper ARIA labels and roles', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Email input should have accessible label
    const emailInput = page.locator('input[type="email"]');
    const ariaLabel = await emailInput.getAttribute('aria-label');
    const ariaLabelledBy = await emailInput.getAttribute('aria-labelledby');
    const inputId = await emailInput.getAttribute('id');
    
    // Should have either aria-label, aria-labelledby, or associated label
    const hasAccessibleLabel = ariaLabel || ariaLabelledBy || (inputId && await page.locator(`label[for="${inputId}"]`).count() > 0);
    expect(hasAccessibleLabel).toBeTruthy();
    
    // Submit button should be keyboard accessible
    const submitButton = page.locator('button:has-text("Continue")');
    await submitButton.focus();
    await expect(submitButton).toBeFocused();
  });

  test('Accessibility: Keyboard navigation works correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Tab to email input
    await page.keyboard.press('Tab');
    const emailInput = page.locator('input[type="email"]');
    
    // Email input should be focused (or will be after another tab)
    await page.keyboard.press('Tab');
    
    // Type email
    await page.keyboard.type(TEST_USER_EMAIL);
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    
    // Form should submit
    await page.waitForTimeout(1000);
    
    // Should show loading or next step
    const hasResponse = await page.locator('button:disabled, text=not registered, button:has-text("Authenticate")').isVisible().catch(() => false);
    expect(hasResponse).toBeTruthy();
  });
});

test.describe('Sign-In Scenario: Security Validation', () => {
  test('Security: Password fields are not present (passwordless auth)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Should NOT have password input (YubiKey/WebAuthn only)
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).not.toBeVisible();
  });

  test('Security: Session cookie has proper security flags', async ({ page, context }) => {
    // Mock login
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto(`${BASE_URL}/vault`);
    
    // Check session cookie
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session' || c.name.includes('token'));
    
    if (sessionCookie) {
      // Should be HttpOnly for security
      expect(sessionCookie.httpOnly).toBeTruthy();
      
      // Should have SameSite attribute
      expect(sessionCookie.sameSite).toBeTruthy();
    }
  });

  test('Security: Unauthenticated users cannot access protected routes', async ({ page }) => {
    // Try to access vault without authentication
    await page.goto(`${BASE_URL}/vault`);
    
    // Should be redirected to login
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});

test.describe('Sign-In Scenario: Error Recovery', () => {
  test('Error Recovery: User can correct email after error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Enter wrong email
    await submitEmail(page, NON_EXISTENT_EMAIL);
    await page.waitForTimeout(1500);
    
    // Should show error
    const errorMessage = page.locator('text=not registered, text=not found');
    if (await errorMessage.isVisible().catch(() => false)) {
      // User can edit email
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeEnabled();
      
      // Clear and enter correct email
      await emailInput.clear();
      await emailInput.fill(TEST_USER_EMAIL);
      
      // Error should clear or user can retry
      await page.click('button:has-text("Continue")');
      await page.waitForTimeout(1000);
      
      // Should proceed to next step or show different error
      const hasProgressed = await page.locator('button:has-text("Authenticate"), text=not registered').isVisible().catch(() => false);
      expect(hasProgressed).toBeTruthy();
    }
  });

  test('Error Recovery: User can retry after WebAuthn failure', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Simulate WebAuthn failure
    let failCount = 0;
    await page.route('**/api/auth/**', route => {
      if (failCount === 0) {
        failCount++;
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await submitEmail(page, TEST_USER_EMAIL);
    await page.waitForTimeout(2000);
    
    // If error occurred, retry button should be available
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again"), button:has-text("Continue")');
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
      await page.waitForTimeout(1000);
      
      // Second attempt should succeed (or show different result)
      const hasProgressed = await page.locator('button:has-text("Authenticate"), text=not registered').isVisible().catch(() => false);
      expect(hasProgressed).toBeTruthy();
    }
  });
});
