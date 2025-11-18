# Sign-In Scenario E2E Test Documentation

## Overview

This document describes the comprehensive end-to-end (E2E) test suite for the Bifrostvault sign-in scenario. The tests cover the complete user authentication journey from landing page to vault access.

## Test File Location

- **File**: `e2e/signin-scenario.spec.ts`
- **Framework**: Playwright
- **Language**: TypeScript

## Test Coverage

### 1. Complete User Journey Tests

#### Scenario 1: Successful Sign-In Flow (Happy Path)
**Test**: `Scenario 1: Successful sign-in from landing page to vault`

**Steps Covered**:
1. User lands on homepage
2. User clicks "Sign In" button
3. User is redirected to login page
4. User sees email input field
5. User enters valid email
6. User clicks "Continue" button
7. Loading state is shown
8. Email input is disabled during loading
9. YubiKey authentication prompt appears (or error for non-existent user)
10. User clicks "Authenticate with YubiKey"
11. WebAuthn authentication is triggered
12. Authentication completes
13. User is redirected to vault/dashboard
14. Session cookie is created
15. User can see vault content

**Expected Outcomes**:
- ✅ Smooth navigation flow
- ✅ Proper loading states
- ✅ Successful authentication
- ✅ Session persistence
- ✅ Access to protected routes

---

#### Scenario 2: Non-Existent User Error
**Test**: `Scenario 2: Sign-in with non-existent user shows error`

**Steps Covered**:
1. Navigate to sign-in page
2. Enter non-existent email
3. Submit form
4. Wait for response

**Expected Outcomes**:
- ✅ Clear error message displayed
- ✅ User-friendly error text
- ✅ User remains on login page
- ✅ Email input enabled for retry

---

#### Scenario 3: Invalid Email Format Validation
**Test**: `Scenario 3: Sign-in with invalid email format shows validation error`

**Steps Covered**:
1. Navigate to sign-in page
2. Enter invalid email format (e.g., "invalid-email")
3. Try to submit form

**Expected Outcomes**:
- ✅ HTML5 validation prevents submission
- ✅ Validation message shown
- ✅ User remains on login page

---

#### Scenario 4: WebAuthn Cancellation Handling
**Test**: `Scenario 4: WebAuthn authentication cancellation is handled gracefully`

**Steps Covered**:
1. Navigate to sign-in page
2. Override WebAuthn to simulate cancellation
3. Enter email and submit
4. Click "Authenticate with YubiKey"
5. Cancellation occurs

**Expected Outcomes**:
- ✅ Cancellation error displayed
- ✅ User can retry authentication
- ✅ No application crash

---

#### Scenario 5: Network Error Handling
**Test**: `Scenario 5: Network error during sign-in is handled gracefully`

**Steps Covered**:
1. Navigate to sign-in page
2. Simulate network failure
3. Enter email and submit

**Expected Outcomes**:
- ✅ Error message or retry option shown
- ✅ Graceful degradation
- ✅ User can attempt retry

---

#### Scenario 6: Session Persistence
**Test**: `Scenario 6: Session persists across page reloads`

**Steps Covered**:
1. Mock logged-in user
2. Navigate to protected page
3. Verify authentication
4. Reload page
5. Check session persistence

**Expected Outcomes**:
- ✅ Session cookie persists
- ✅ User remains authenticated
- ✅ No redirect to login page

---

#### Scenario 7: Sign Out and Re-Authentication
**Test**: `Scenario 7: User can sign out and sign in again`

**Steps Covered**:
1. Mock logged-in user
2. Navigate to vault
3. Click logout button
4. Verify session cleared
5. Attempt to sign in again

**Expected Outcomes**:
- ✅ Logout clears session
- ✅ Redirect to login page
- ✅ User can re-authenticate

---

### 2. UI/UX Validation Tests

#### Branding and Layout
**Test**: `UI: Sign-in page has proper branding and layout`

**Checks**:
- ✅ Logo or app name visible
- ✅ Clear heading
- ✅ Email input with label
- ✅ Submit button
- ✅ Link to registration

---

#### Responsive Design
**Test**: `UI: Sign-in page is responsive on mobile`

**Viewports Tested**:
- Mobile: 375x667
- Tablet: 768x1024
- Desktop: 1920x1080

**Checks**:
- ✅ All elements visible
- ✅ No overflow
- ✅ Touch-friendly buttons

---

#### Loading States
**Test**: `UI: Loading states provide visual feedback`

**Checks**:
- ✅ Loading indicator shown
- ✅ Button disabled during loading
- ✅ Visual feedback clear

---

#### Accessibility: ARIA Labels
**Test**: `Accessibility: Form has proper ARIA labels and roles`

**Checks**:
- ✅ Email input has accessible label
- ✅ Submit button keyboard accessible
- ✅ Proper ARIA attributes

---

#### Accessibility: Keyboard Navigation
**Test**: `Accessibility: Keyboard navigation works correctly`

**Checks**:
- ✅ Tab navigation works
- ✅ Enter key submits form
- ✅ Focus indicators visible

---

### 3. Security Validation Tests

#### Passwordless Authentication
**Test**: `Security: Password fields are not present (passwordless auth)`

**Checks**:
- ✅ No password input fields
- ✅ YubiKey/WebAuthn only

---

#### Cookie Security
**Test**: `Security: Session cookie has proper security flags`

**Checks**:
- ✅ HttpOnly flag set
- ✅ SameSite attribute present
- ✅ Secure flag (in production)

---

#### Route Protection
**Test**: `Security: Unauthenticated users cannot access protected routes`

**Checks**:
- ✅ Redirect to login when accessing vault
- ✅ No unauthorized access

---

### 4. Error Recovery Tests

#### Email Correction
**Test**: `Error Recovery: User can correct email after error`

**Checks**:
- ✅ Email input enabled after error
- ✅ User can clear and re-enter
- ✅ Form can be resubmitted

---

#### Retry After Failure
**Test**: `Error Recovery: User can retry after WebAuthn failure`

**Checks**:
- ✅ Retry button available
- ✅ Second attempt works
- ✅ No permanent failure state

---

## Running the Tests

### Run All Sign-In Tests
```bash
pnpm test:e2e:signin
```

### Run All E2E Tests
```bash
pnpm test:e2e
```

### Run with UI Mode (Interactive)
```bash
pnpm test:e2e:ui
```

### Run in Headed Mode (See Browser)
```bash
pnpm test:e2e:headed
```

### Run in Debug Mode
```bash
pnpm test:e2e:debug
```

### Run Specific Test
```bash
pnpm exec playwright test -g "Scenario 1"
```

### Run on Specific Browser
```bash
pnpm exec playwright test signin-scenario --project=chromium
pnpm exec playwright test signin-scenario --project=firefox
pnpm exec playwright test signin-scenario --project=webkit
```

---

## Test Configuration

### Playwright Config
- **Location**: `playwright.config.ts`
- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Parallel Execution**: Enabled
- **Retries**: 2 (on CI only)
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

### Test Fixtures
- **Location**: `e2e/fixtures/auth.ts`
- **Mock Users**: Regular user, Admin user
- **Helpers**: mockLogin, mockLogout, isAuthenticated, waitForAuth

### WebAuthn Mock
- **Location**: `e2e/helpers/webauthn-mock.ts`
- **Purpose**: Simulate YubiKey authentication without physical device
- **Supported Types**: YubiKey 5, Security Key

---

## Test Results

### Expected Test Count
- **Total Scenarios**: 17 tests
- **User Journey Tests**: 7 tests
- **UI/UX Tests**: 5 tests
- **Security Tests**: 3 tests
- **Error Recovery Tests**: 2 tests

### Success Criteria
- ✅ All tests pass on Chromium
- ✅ All tests pass on Firefox
- ✅ All tests pass on WebKit
- ✅ No console errors
- ✅ No accessibility violations
- ✅ Responsive on all viewports

---

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
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e:signin
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging Failed Tests

### View Test Report
```bash
pnpm exec playwright show-report
```

### Run Single Test in Debug Mode
```bash
pnpm exec playwright test --debug -g "Scenario 1"
```

### View Screenshots
- Location: `test-results/`
- Captured on failure only

### View Videos
- Location: `test-results/`
- Captured on failure only

### View Traces
- Location: `test-results/`
- Open with: `pnpm exec playwright show-trace trace.zip`

---

## Test Maintenance

### Adding New Tests
1. Create new test in `e2e/signin-scenario.spec.ts`
2. Follow existing test structure
3. Use helper functions from fixtures
4. Add documentation to this file

### Updating Tests
1. Modify test in `e2e/signin-scenario.spec.ts`
2. Run tests to verify changes
3. Update documentation if needed

### Test Data
- Mock users defined in `e2e/fixtures/auth.ts`
- Test emails: `testuser@example.com`, `admin@example.com`
- Non-existent email: `nonexistent@example.com`

---

## Known Limitations

1. **Database Dependency**: Some tests require a user to exist in the database
   - Tests will show appropriate errors if user doesn't exist
   - This is expected behavior in a fresh test environment

2. **WebAuthn Mock**: Tests use mocked WebAuthn
   - Real YubiKey testing requires physical device
   - Mock simulates successful authentication

3. **Network Mocking**: Some tests mock network failures
   - Real network issues may behave differently

---

## Best Practices

1. **Test Independence**: Each test should be independent
2. **Clean State**: Use beforeEach to reset state
3. **Explicit Waits**: Use waitFor instead of arbitrary timeouts
4. **Descriptive Names**: Test names should describe the scenario
5. **Error Messages**: Assertions should have clear error messages

---

## Troubleshooting

### Tests Fail with "Target closed"
- **Cause**: Page closed before test completes
- **Solution**: Add proper waits and check for element visibility

### Tests Fail with "Timeout"
- **Cause**: Element not found or network slow
- **Solution**: Increase timeout or check selectors

### Tests Fail with "Element not visible"
- **Cause**: Element hidden or not rendered
- **Solution**: Check CSS and wait for proper state

### WebAuthn Mock Not Working
- **Cause**: Mock not installed before test
- **Solution**: Ensure `installWebAuthnMock` called in beforeEach

---

## Support

For issues or questions:
1. Check test logs and screenshots
2. Review this documentation
3. Check Playwright documentation: https://playwright.dev
4. Review existing tests for examples

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Author**: Manus AI Agent
