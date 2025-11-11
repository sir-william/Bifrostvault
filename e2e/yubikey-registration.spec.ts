/**
 * E2E Tests: YubiKey Registration
 * 
 * Tests the complete YubiKey registration flow including:
 * - Standard YubiKey registration
 * - YubiKey Bio registration with biometric support
 * - Error handling and validation
 * - Credential limit warnings
 */

import { test, expect } from '@playwright/test';
import { installWebAuthnMock, getMockCredentialInfo } from './helpers/webauthn-mock';
import { mockLogin, MOCK_USERS } from './fixtures/auth';

test.describe('YubiKey Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await mockLogin(page, MOCK_USERS.regularUser);
  });

  test('should display YubiKey setup page', async ({ page }) => {
    await page.goto('/setup-yubikey');
    
    // Check page title
    await expect(page.locator('h2')).toContainText('YubiKey Setup');
    
    // Check info card
    await expect(page.locator('text=Hardware Authentication')).toBeVisible();
    
    // Check registration form
    await expect(page.locator('input#credential-name')).toBeVisible();
    await expect(page.locator('button:has-text("Register YubiKey")')).toBeVisible();
  });

  test('should register a standard YubiKey 5', async ({ page }) => {
    // Install WebAuthn mock for YubiKey 5
    await installWebAuthnMock(page, { type: 'yubikey5' });
    
    await page.goto('/setup-yubikey');
    
    // Fill in credential name
    await page.fill('input#credential-name', 'My YubiKey 5');
    
    // Click register button
    await page.click('button:has-text("Register YubiKey")');
    
    // Wait for registration to complete
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Verify credential appears in list
    await expect(page.locator('text=My YubiKey 5')).toBeVisible();
    await expect(page.locator('text=YubiKey 5')).toBeVisible();
  });

  test('should register a YubiKey Bio with biometric support', async ({ page }) => {
    // Install WebAuthn mock for YubiKey Bio
    await installWebAuthnMock(page, { 
      type: 'bio',
      userVerification: true 
    });
    
    await page.goto('/setup-yubikey');
    
    // Fill in credential name
    await page.fill('input#credential-name', 'My YubiKey Bio');
    
    // Click register button
    await page.click('button:has-text("Register YubiKey")');
    
    // Wait for registration to complete
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Verify credential appears in list with Bio badge
    await expect(page.locator('text=My YubiKey Bio')).toBeVisible();
    await expect(page.locator('text=YubiKey Bio')).toBeVisible();
    await expect(page.locator('text=Biometric')).toBeVisible();
  });

  test('should register a Security Key C NFC', async ({ page }) => {
    // Install WebAuthn mock for Security Key
    await installWebAuthnMock(page, { type: 'securitykey' });
    
    await page.goto('/setup-yubikey');
    
    // Fill in credential name
    await page.fill('input#credential-name', 'Security Key C NFC');
    
    // Click register button
    await page.click('button:has-text("Register YubiKey")');
    
    // Wait for registration to complete
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Verify credential appears in list
    await expect(page.locator('text=Security Key C NFC')).toBeVisible();
    await expect(page.locator('text=Security Key')).toBeVisible();
  });

  test('should show Bio-specific information when Bio key is detected', async ({ page }) => {
    // Install WebAuthn mock for YubiKey Bio
    await installWebAuthnMock(page, { type: 'bio', userVerification: true });
    
    await page.goto('/setup-yubikey');
    
    // Register a Bio key first
    await page.fill('input#credential-name', 'Test Bio Key');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Reload page to see Bio-specific alerts
    await page.reload();
    
    // Check for Bio detection alert
    await expect(page.locator('text=YubiKey Bio Detected')).toBeVisible();
    await expect(page.locator('text=supports up to 25 discoverable credentials')).toBeVisible();
  });

  test('should validate credential name is required', async ({ page }) => {
    await page.goto('/setup-yubikey');
    
    // Try to register without name
    const registerButton = page.locator('button:has-text("Register YubiKey")');
    await expect(registerButton).toBeDisabled();
    
    // Fill in name
    await page.fill('input#credential-name', 'Test Key');
    await expect(registerButton).toBeEnabled();
  });

  test('should handle registration cancellation gracefully', async ({ page }) => {
    // Install WebAuthn mock that will simulate cancellation
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'credentials', {
        value: {
          create: async () => {
            throw new Error('The operation either timed out or was not allowed. See: https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client.');
          },
        },
        configurable: true,
      });
    });
    
    await page.goto('/setup-yubikey');
    
    await page.fill('input#credential-name', 'Test Key');
    await page.click('button:has-text("Register YubiKey")');
    
    // Should show cancellation error
    await expect(page.locator('text=Registration cancelled')).toBeVisible({ timeout: 10000 });
  });

  test('should display credential limit warning for Bio keys', async ({ page }) => {
    // Install WebAuthn mock for YubiKey Bio
    await installWebAuthnMock(page, { type: 'bio' });
    
    await page.goto('/setup-yubikey');
    
    // Register 20 credentials to trigger warning
    for (let i = 1; i <= 20; i++) {
      await page.fill('input#credential-name', `Bio Key ${i}`);
      await page.click('button:has-text("Register YubiKey")');
      await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
      
      // Dismiss toast
      await page.waitForTimeout(2000);
    }
    
    // Reload to see warning
    await page.reload();
    
    // Should show credential limit warning
    await expect(page.locator('text=Approaching Credential Limit')).toBeVisible();
    await expect(page.locator('text=20/25 used')).toBeVisible();
  });

  test('should show last verified timestamp for Bio keys', async ({ page }) => {
    // Install WebAuthn mock for YubiKey Bio with user verification
    await installWebAuthnMock(page, { 
      type: 'bio',
      userVerification: true 
    });
    
    await page.goto('/setup-yubikey');
    
    // Register Bio key
    await page.fill('input#credential-name', 'Bio with Verification');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Reload page
    await page.reload();
    
    // Should show last verified timestamp
    await expect(page.locator('text=Last biometric verification:')).toBeVisible();
  });

  test('should clear input field after successful registration', async ({ page }) => {
    await installWebAuthnMock(page, { type: 'yubikey5' });
    
    await page.goto('/setup-yubikey');
    
    const nameInput = page.locator('input#credential-name');
    
    await nameInput.fill('Test Key');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Input should be cleared
    await expect(nameInput).toHaveValue('');
  });

  test('should display multiple registered keys with different types', async ({ page }) => {
    await page.goto('/setup-yubikey');
    
    // Register YubiKey 5
    await installWebAuthnMock(page, { type: 'yubikey5' });
    await page.fill('input#credential-name', 'YubiKey 5');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Register YubiKey Bio
    await installWebAuthnMock(page, { type: 'bio', userVerification: true });
    await page.fill('input#credential-name', 'YubiKey Bio');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Register Security Key
    await installWebAuthnMock(page, { type: 'securitykey' });
    await page.fill('input#credential-name', 'Security Key');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Reload to see all keys
    await page.reload();
    
    // Verify all three keys are displayed with correct badges
    await expect(page.locator('text=YubiKey 5').first()).toBeVisible();
    await expect(page.locator('text=YubiKey Bio').first()).toBeVisible();
    await expect(page.locator('text=Security Key').first()).toBeVisible();
    
    // Verify credential count
    await expect(page.locator('text=3 YubiKey(s) registered')).toBeVisible();
  });
});
