# Bifrostvault Standalone Authentication Implementation Plan

## Current State Analysis

### Existing Authentication Flow
1. **OAuth Portal** - External authentication required (currently placeholder)
2. **YubiKey/WebAuthn** - Secondary authentication after OAuth login
3. **TOTP** - Optional 2FA after OAuth login

### Problem
- Application requires external OAuth portal that doesn't exist
- No standalone registration/login capability
- YubiKey is advertised as primary security but only works as 2FA

## Proposed Solution

### New Standalone Authentication Flow

#### Registration (Sign Up)
1. User enters email/username
2. User registers YubiKey via WebAuthn
3. Account created with YubiKey as primary authentication
4. Optional: Set up TOTP as backup

#### Login (Sign In)
1. User enters email/username
2. User authenticates with YubiKey via WebAuthn
3. Session created
4. Optional: TOTP verification if enabled

### Implementation Steps

#### 1. Backend Changes

**A. New Authentication Routes (`server/auth.ts`)**
```typescript
- POST /api/auth/register - Register new user with email + YubiKey
- POST /api/auth/login/init - Initialize login (get WebAuthn challenge)
- POST /api/auth/login/verify - Verify YubiKey and create session
- GET /api/auth/check - Check if email exists
```

**B. Update tRPC Routers (`server/routers.ts`)**
```typescript
- auth.register - Register with email + WebAuthn
- auth.loginInit - Start login process
- auth.loginVerify - Complete login with YubiKey
- auth.checkEmail - Check if email is registered
```

**C. Database Schema Updates**
- Ensure users table supports email-based lookup
- Add username field if needed
- Update user creation to not require OAuth

#### 2. Frontend Changes

**A. New Pages**
- `/register` - Registration page
- `/login` - Login page (replace OAuth redirect)

**B. Update Components**
- Home page buttons → Link to /register and /login
- Remove OAuth portal dependency

**C. Registration Flow UI**
1. Email/username input
2. YubiKey registration prompt
3. Success confirmation
4. Redirect to vault

**D. Login Flow UI**
1. Email/username input
2. YubiKey authentication prompt
3. Optional TOTP if enabled
4. Redirect to vault

#### 3. Security Considerations

- **Email Validation**: Basic format validation
- **Rate Limiting**: Prevent brute force
- **Challenge Storage**: Use in-memory Map (upgrade to Redis for production)
- **Session Management**: Existing cookie-based system
- **YubiKey Verification**: Existing WebAuthn implementation

## Implementation Priority

### Phase 1: Core Authentication (High Priority)
- [ ] Create standalone registration endpoint
- [ ] Create standalone login endpoints
- [ ] Update frontend to use new auth flow
- [ ] Remove OAuth dependency

### Phase 2: UI/UX (Medium Priority)
- [ ] Design registration page
- [ ] Design login page
- [ ] Add loading states
- [ ] Add error handling

### Phase 3: Enhancements (Low Priority)
- [ ] Add password option (optional backup)
- [ ] Improve rate limiting
- [ ] Add email verification
- [ ] Add account recovery flow

## Files to Modify

### Backend
1. `server/auth.ts` (NEW) - Standalone auth routes
2. `server/routers.ts` - Add new tRPC procedures
3. `server/_core/index.ts` - Register new routes
4. `server/db.ts` - Add user lookup by email

### Frontend
1. `client/src/pages/Register.tsx` (NEW)
2. `client/src/pages/Login.tsx` (NEW)
3. `client/src/pages/Home.tsx` - Update button links
4. `client/src/const.ts` - Remove OAuth dependency (already done)
5. `client/src/App.tsx` - Add new routes

## Testing Plan

### E2E Tests
1. **Registration Flow**
   - Enter email
   - Register YubiKey
   - Verify account created
   - Verify session created

2. **Login Flow**
   - Enter email
   - Authenticate with YubiKey
   - Verify session created
   - Access vault

3. **Error Cases**
   - Duplicate email registration
   - Invalid email format
   - YubiKey registration failure
   - Login with unregistered email
   - Login with wrong YubiKey

## Migration Strategy

### For Existing OAuth Users
- Keep OAuth flow as optional
- Add "Link YubiKey" option
- Allow migration to standalone auth

### Backward Compatibility
- Maintain existing OAuth routes
- Support both auth methods
- Gradual migration path

## Next Steps

1. Implement backend authentication endpoints
2. Create registration and login pages
3. Update routing and navigation
4. Test E2E flows
5. Deploy and verify
