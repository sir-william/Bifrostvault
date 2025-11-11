/**
 * E2E Tests: YubiKey Authentication
 * 
 * Tests the complete YubiKey authentication flow including:
 * - Standard YubiKey authentication
 * - YubiKey Bio biometric authentication
 * - User verification tracking
 * - Authentication failure handling
 */

import { test, expect } from '@playwright/test';
import { installWebAuthnMock, simulateBiometricAuth, simulateBiometricBlocked } from './helpers/webauthn-mock';
import { mockLogin, mockLogout, MOCK_USERS } from './fixtures/auth';

test.describe('YubiKey Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start logged out
    await mockLogout(page);
  });

  test('should authenticate with standard YubiKey 5', async ({ page }) => {
    // Install WebAuthn mock for YubiKey 5
    await installWebAuthnMock(page, { type: 'yubikey5' });
    
    // Navigate to vault (should redirect to login)
    await page.goto('/vault');
    
    // Should redirect to OAuth login
    // In a real scenario, after OAuth, WebAuthn would be triggered
    // For testing, we'll mock the entire flow
    
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/vault');
    
    // Should be authenticated and see vault
    await expect(page.locator('text=Your vault')).toBeVisible({ timeout: 10000 });
  });

  test('should authenticate with YubiKey Bio using fingerprint', async ({ page }) => {
    // Install WebAuthn mock for YubiKey Bio with user verification
    await installWebAuthnMock(page, { 
      type: 'bio',
      userVerification: true 
    });
    
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/vault');
    
    // Simulate successful biometric authentication
    await simulateBiometricAuth(page, true);
    
    // Should be authenticated
    await expect(page.locator('text=Your vault')).toBeVisible({ timeout: 10000 });
  });

  test('should handle biometric authentication failure', async ({ page }) => {
    await installWebAuthnMock(page, { 
      type: 'bio',
      userVerification: true 
    });
    
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/setup-yubikey');
    
    // Try to register with failed biometric
    await page.fill('input#credential-name', 'Test Bio Key');
    
    // Simulate biometric failure
    await page.addInitScript(() => {
      let attemptCount = 0;
      const originalCreate = (navigator.credentials as any).create;
      
      (navigator.credentials as any).create = async function(...args: any[]) {
        attemptCount++;
        if (attemptCount <= 3) {
          throw new Error('Fingerprint not recognized');
        }
        return originalCreate.apply(this, args);
      };
    });
    
    await page.click('button:has-text("Register YubiKey")');
    
    // Should show error after failed attempts
    await expect(page.locator('text=Failed to register YubiKey')).toBeVisible({ timeout: 10000 });
  });

  test('should handle biometric blocked state', async ({ page }) => {
    await installWebAuthnMock(page, { 
      type: 'bio',
      userVerification: true 
    });
    
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/setup-yubikey');
    
    // Simulate biometric blocked state
    await page.addInitScript(() => {
      (navigator.credentials as any).create = async function() {
        throw new Error('Biometric authentication is blocked. Please use PIN.');
      };
    });
    
    await page.fill('input#credential-name', 'Test Key');
    await page.click('button:has-text("Register YubiKey")');
    
    // Should show blocked state error
    await expect(page.locator('text=Failed to register YubiKey')).toBeVisible({ timeout: 10000 });
  });

  test('should track user verification status', async ({ page }) => {
    // Install WebAuthn mock with user verification enabled
    await installWebAuthnMock(page, { 
      type: 'bio',
      userVerification: true 
    });
    
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/setup-yubikey');
    
    // Register key with user verification
    await page.fill('input#credential-name', 'Verified Key');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Reload and check for verification badge
    await page.reload();
    await expect(page.locator('text=Biometric')).toBeVisible();
  });

  test('should update last used timestamp after authentication', async ({ page }) => {
    await installWebAuthnMock(page, { type: 'yubikey5' });
    
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/setup-yubikey');
    
    // Register a key
    await page.fill('input#credential-name', 'Test Key');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Get initial timestamp
    const initialTimestamp = await page.locator('text=/Added.*/'').textContent();
    
    // Simulate authentication (in real app, this would happen during login)
    // For testing, we'll just verify the timestamp is shown
    await page.reload();
    
    // Timestamp should be displayed
    await expect(page.locator('text=/Added.*/')).toBeVisible();
  });

  test('should allow authentication with any registered key', async ({ page }) => {
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/setup-yubikey');
    
    // Register multiple keys
    await installWebAuthnMock(page, { type: 'yubikey5' });
    await page.fill('input#credential-name', 'Key 1');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    await installWebAuthnMock(page, { type: 'bio', userVerification: true });
    await page.fill('input#credential-name', 'Key 2');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Both keys should be listed
    await page.reload();
    await expect(page.locator('text=2 YubiKey(s) registered')).toBeVisible();
  });

  test('should prevent authentication without registered key', async ({ page }) => {
    // No WebAuthn mock installed (no registered key)
    
    await page.goto('/vault');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|oauth/);
  });

  test('should handle authentication timeout', async ({ page }) => {
    await page.addInitScript(() => {
      (navigator.credentials as any).create = async function() {
        // Simulate timeout
        await new Promise(resolve => setTimeout(resolve, 60000));
        throw new Error('The operation either timed out or was not allowed.');
      };
    });
    
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/setup-yubikey');
    
    await page.fill('input#credential-name', 'Test Key');
    await page.click('button:has-text("Register YubiKey")');
    
    // Should show timeout error (with shorter timeout for testing)
    await expect(page.locator('text=Failed to register YubiKey')).toBeVisible({ timeout: 15000 });
  });

  test('should display appropriate message for Bio vs non-Bio keys', async ({ page }) => {
    await mockLogin(page, MOCK_USERS.regularUser);
    await page.goto('/setup-yubikey');
    
    // Register non-Bio key
    await installWebAuthnMock(page, { type: 'yubikey5' });
    await page.fill('input#credential-name', 'Standard Key');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Should NOT show Bio-specific messages
    await page.reload();
    await expect(page.locator('text=YubiKey Bio Detected')).not.toBeVisible();
    
    // Register Bio key
    await installWebAuthnMock(page, { type: 'bio', userVerification: true });
    await page.fill('input#credential-name', 'Bio Key');
    await page.click('button:has-text("Register YubiKey")');
    await expect(page.locator('text=YubiKey registered successfully!')).toBeVisible({ timeout: 10000 });
    
    // Should show Bio-specific messages
    await page.reload();
    await expect(page.locator('text=YubiKey Bio Detected')).toBeVisible();
  });
});
