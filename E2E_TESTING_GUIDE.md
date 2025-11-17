# E2E Testing Guide for Bifrostvault

## Overview

This guide covers the End-to-End (E2E) testing setup for Bifrostvault, including registration, login, email verification, and vault access flows.

## Test Framework

- **Framework**: Playwright
- **Language**: TypeScript
- **Test Runner**: Playwright Test Runner
- **Browser Support**: Chromium, Firefox, WebKit

## Test Files

### 1. `registration-with-verification.spec.ts`
Tests the complete registration flow with email verification:
- Email and name input validation
- YubiKey registration
- Email verification page display
- Resend verification email
- Change email functionality
- Invalid token handling
- localStorage persistence

### 2. `login-flow.spec.ts`
Tests the login authentication flow:
- Email input validation
- YubiKey authentication
- Error handling for non-existent users
- WebAuthn cancellation
- Loading states
- Session management
- UI responsiveness

### 3. `complete-user-journey.spec.ts`
Tests the full user journey:
- Complete registration → verification → vault flow
- Logout and re-login
- Duplicate registration prevention
- Multiple browser tabs
- Browser navigation (back/forward)
- Network conditions
- Security checks

### 4. Existing Tests
- `yubikey-registration.spec.ts` - YubiKey registration tests
- `yubikey-authentication.spec.ts` - YubiKey authentication tests
- `vault-operations.spec.ts` - Vault CRUD operations

## WebAuthn Mocking

### Mock Helper: `helpers/webauthn-mock.ts`

The WebAuthn mock simulates YubiKey hardware without requiring physical devices:

```typescript
import { installWebAuthnMock } from './helpers/webauthn-mock';

// In test
await installWebAuthnMock(page, { 
  type: 'yubikey5',
  userVerification: false 
});
```

**Supported YubiKey Types:**
- `yubikey5` - YubiKey 5 Series (default)
- `bio` - YubiKey Bio (with biometric)
- `securitykey` - Security Key Series

## Running Tests

### Run All E2E Tests
```bash
pnpm test:e2e
```

### Run Specific Test File
```bash
pnpm playwright test e2e/registration-with-verification.spec.ts
```

### Run in Headed Mode (See Browser)
```bash
pnpm playwright test --headed
```

### Run in Debug Mode
```bash
pnpm playwright test --debug
```

### Run Specific Test
```bash
pnpm playwright test -g "should complete full registration flow"
```

### Run in UI Mode (Interactive)
```bash
pnpm playwright test --ui
```

## Test Configuration

### playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Structure

### Typical Test Pattern

```typescript
import { test, expect } from '@playwright/test';
import { installWebAuthnMock } from './helpers/webauthn-mock';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Install WebAuthn mock
    await installWebAuthnMock(page, { type: 'yubikey5' });
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/register');

    // Act
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Continue")');

    // Assert
    await expect(page).toHaveURL(/\/verify-email/);
  });
});
```

## Test Data

### Dynamic Test Data
Generate unique test data for each run to avoid conflicts:

```typescript
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_NAME = `Test User ${Date.now()}`;
```

### Fixed Test Data
Use for specific scenarios:

```typescript
const EXISTING_EMAIL = 'existing@example.com';
const INVALID_EMAIL = 'invalid-email';
```

## Assertions

### Common Assertions

```typescript
// URL assertions
await expect(page).toHaveURL(/\/register/);

// Element visibility
await expect(page.locator('text=Welcome')).toBeVisible();

// Element state
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('input')).toBeFocused();

// Text content
await expect(page.locator('h1')).toHaveText('Sign In');

// Timeout for async operations
await expect(page.locator('text=Success')).toBeVisible({ timeout: 5000 });
```

## Handling Asynchronous Operations

### Wait for Network Requests
```typescript
await page.waitForResponse(resp => 
  resp.url().includes('/api/auth/register') && resp.status() === 200
);
```

### Wait for Navigation
```typescript
await page.waitForURL(/\/vault/);
```

### Wait for Element
```typescript
await page.waitForSelector('button:has-text("Submit")');
```

### Fixed Timeout (Use Sparingly)
```typescript
await page.waitForTimeout(1000); // Only for WebAuthn mock delays
```

## Error Handling

### Check for Multiple Possible States
```typescript
const hasSuccess = await page.locator('text=Success').isVisible().catch(() => false);
const hasError = await page.locator('text=Error').isVisible().catch(() => false);

expect(hasSuccess || hasError).toBeTruthy();
```

### Network Error Simulation
```typescript
await page.route('**/api/**', route => route.abort());
```

### WebAuthn Error Simulation
```typescript
await page.evaluate(() => {
  (navigator.credentials as any).create = async () => {
    throw new DOMException('Cancelled', 'NotAllowedError');
  };
});
```

## Best Practices

### 1. Standalone Tests
- Each test should be independent
- Don't rely on test execution order
- Clean up after tests (if needed)

### 2. Realistic User Behavior
- Use real user interactions (click, type, etc.)
- Don't access internal state directly
- Test what users see and do

### 3. Avoid Hardcoded Waits
```typescript
// ❌ Bad
await page.waitForTimeout(5000);

// ✅ Good
await expect(page.locator('text=Loaded')).toBeVisible({ timeout: 5000 });
```

### 4. Use Descriptive Test Names
```typescript
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('should show error when email is already registered', async ({ page }) => { ... });
```

### 5. Group Related Tests
```typescript
test.describe('Registration Flow', () => {
  test.describe('Email Validation', () => {
    test('should reject invalid email format', ...);
    test('should reject duplicate email', ...);
  });
});
```

## Debugging Tests

### 1. Use Headed Mode
```bash
pnpm playwright test --headed
```

### 2. Use Debug Mode
```bash
pnpm playwright test --debug
```

### 3. Add Console Logs
```typescript
page.on('console', msg => console.log('Browser:', msg.text()));
```

### 4. Take Screenshots
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### 5. Pause Execution
```typescript
await page.pause(); // Opens Playwright Inspector
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Coverage

### Current Coverage

- ✅ Registration flow with email verification
- ✅ Login flow with YubiKey authentication
- ✅ Email verification page
- ✅ Resend verification email
- ✅ Error handling (invalid email, duplicate registration, etc.)
- ✅ WebAuthn cancellation
- ✅ UI responsiveness
- ✅ Browser navigation
- ✅ Loading states
- ✅ Security checks

### Future Coverage

- ⏳ Vault CRUD operations with verification
- ⏳ Password generation
- ⏳ TOTP setup
- ⏳ Account settings
- ⏳ Export/import functionality

## Troubleshooting

### Tests Fail with "Timeout"
- Increase timeout: `{ timeout: 10000 }`
- Check if server is running
- Check network requests in browser DevTools

### WebAuthn Mock Not Working
- Ensure `installWebAuthnMock()` is called in `beforeEach`
- Check browser console for errors
- Verify mock is installed before navigation

### Tests Pass Locally but Fail in CI
- Check for timing issues (add proper waits)
- Ensure CI has all dependencies
- Check for environment-specific issues

### Flaky Tests
- Use proper wait conditions instead of fixed timeouts
- Make tests more resilient to timing variations
- Check for race conditions

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [YubiKey Developer Guide](https://developers.yubico.com/)

## Contributing

When adding new features:

1. Write E2E tests first (TDD approach)
2. Ensure tests are standalone and don't rely on external services
3. Use descriptive test names
4. Add documentation for complex test scenarios
5. Run tests locally before committing
6. Ensure tests pass in CI

## Summary

The E2E test suite for Bifrostvault provides comprehensive coverage of:

- **User Registration**: Email validation, YubiKey setup, duplicate prevention
- **Email Verification**: Verification flow, resend functionality, error handling
- **User Login**: Email validation, YubiKey authentication, session management
- **User Experience**: Responsive design, loading states, error recovery
- **Security**: Secure cookies, HTTPS enforcement, sensitive data protection

All tests are **standalone** and **agent-agnostic**, requiring no external dependencies or manual intervention during execution.
