# Sign-In E2E Test - Quick Start Guide

## 🚀 Quick Start

### Run Sign-In Tests (Chromium Only)
```bash
pnpm test:e2e:signin --project=chromium
```

### Run All Sign-In Tests (All Browsers)
```bash
pnpm test:e2e:signin
```

### Run with Visual UI (Recommended for Development)
```bash
pnpm test:e2e:ui
```

---

## 📊 Test Summary

**Total Tests**: 17 scenarios × 5 browsers = **85 test cases**

### Test Categories

1. **User Journey Tests** (7 scenarios)
   - ✅ Successful sign-in flow
   - ✅ Non-existent user error
   - ✅ Invalid email validation
   - ✅ WebAuthn cancellation
   - ✅ Network error handling
   - ✅ Session persistence
   - ✅ Sign out and re-authentication

2. **UI/UX Tests** (5 scenarios)
   - ✅ Branding and layout
   - ✅ Responsive design
   - ✅ Loading states
   - ✅ ARIA labels
   - ✅ Keyboard navigation

3. **Security Tests** (3 scenarios)
   - ✅ Passwordless authentication
   - ✅ Cookie security flags
   - ✅ Route protection

4. **Error Recovery Tests** (2 scenarios)
   - ✅ Email correction
   - ✅ Retry after failure

---

## 🎯 What Gets Tested

### Complete Sign-In Flow
```
Landing Page → Sign In Button → Login Page → Email Input → 
Continue → Loading State → YubiKey Auth → Vault Access → 
Session Created ✅
```

### Error Scenarios
- ❌ Non-existent user
- ❌ Invalid email format
- ❌ WebAuthn cancellation
- ❌ Network failures
- ✅ Graceful error handling

### Security Checks
- 🔒 No password fields (passwordless)
- 🔒 HttpOnly cookies
- 🔒 Protected routes
- 🔒 Session management

---

## 🖥️ Browsers Tested

- ✅ Chromium (Desktop Chrome)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

---

## 📁 Test Files

- **Main Test**: `e2e/signin-scenario.spec.ts`
- **Documentation**: `E2E_SIGNIN_TEST_DOCUMENTATION.md`
- **Config**: `playwright.config.ts`
- **Fixtures**: `e2e/fixtures/auth.ts`
- **Helpers**: `e2e/helpers/webauthn-mock.ts`

---

## 🔧 Available Commands

```bash
# Run sign-in tests only
pnpm test:e2e:signin

# Run all E2E tests
pnpm test:e2e

# Interactive UI mode
pnpm test:e2e:ui

# See browser (headed mode)
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug

# Specific browser
pnpm exec playwright test signin-scenario --project=chromium

# Specific test
pnpm exec playwright test -g "Scenario 1"

# View report
pnpm exec playwright show-report
```

---

## ⚙️ Prerequisites

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Install Playwright Browsers**
   ```bash
   pnpm exec playwright install --with-deps
   ```

3. **Start Dev Server** (if not using webServer config)
   ```bash
   pnpm dev
   ```

---

## 📝 Test Output Example

```
Running 85 tests using 5 workers

  ✓ [chromium] › signin-scenario.spec.ts:58:3 › Scenario 1: Successful sign-in (5.2s)
  ✓ [chromium] › signin-scenario.spec.ts:136:3 › Scenario 2: Non-existent user (2.1s)
  ✓ [chromium] › signin-scenario.spec.ts:161:3 › Scenario 3: Invalid email (1.8s)
  ✓ [chromium] › signin-scenario.spec.ts:180:3 › Scenario 4: WebAuthn cancel (3.4s)
  ✓ [chromium] › signin-scenario.spec.ts:207:3 › Scenario 5: Network error (2.9s)
  ...

  85 passed (2.5m)
```

---

## 🐛 Troubleshooting

### Tests Fail: "Target closed"
```bash
# Add more explicit waits
await page.waitForLoadState('networkidle');
```

### Tests Fail: "Timeout"
```bash
# Increase timeout in playwright.config.ts
timeout: 60000
```

### WebAuthn Not Working
```bash
# Ensure mock is installed in beforeEach
await installWebAuthnMock(page, { type: 'yubikey5' });
```

### Dev Server Not Starting
```bash
# Start manually
pnpm dev

# Then run tests with:
pnpm exec playwright test signin-scenario --project=chromium
```

---

## 📊 Expected Results

### ✅ Success Criteria
- All 17 scenarios pass on Chromium
- All 17 scenarios pass on Firefox
- All 17 scenarios pass on WebKit
- All 17 scenarios pass on Mobile Chrome
- All 17 scenarios pass on Mobile Safari
- No console errors
- No accessibility violations

### ⚠️ Known Issues
- Some tests may show "user not registered" error if database is empty
- This is expected behavior and tests handle it gracefully

---

## 📖 Full Documentation

For detailed information, see: **E2E_SIGNIN_TEST_DOCUMENTATION.md**

---

## 🎉 Quick Win

Run this command to see tests in action:
```bash
pnpm test:e2e:ui
```

Then:
1. Click on "signin-scenario.spec.ts"
2. Click on any test scenario
3. Watch it run in the browser preview
4. See step-by-step execution

---

**Created**: 2025-11-18
**Framework**: Playwright v1.56.1
**Node**: v22.x
**Package Manager**: pnpm
