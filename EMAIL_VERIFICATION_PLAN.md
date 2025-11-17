# Email Verification Implementation Plan

## Overview
Add email verification to the registration flow to ensure users own the email addresses they register with.

## User Flow

### Registration with Email Verification
```
1. User enters email and name
2. User registers YubiKey
3. Account created but marked as "unverified"
4. Verification email sent
5. User redirected to "Check your email" page
6. User clicks verification link in email
7. Account marked as "verified"
8. User can now access vault
```

### Login Behavior
- **Unverified users**: Redirected to "verify email" page with resend option
- **Verified users**: Normal login flow

## Database Schema Changes

### Update `users` table
Add new column:
```sql
emailVerified BOOLEAN DEFAULT FALSE
verificationToken VARCHAR(255) UNIQUE
verificationTokenExpiry TIMESTAMP
```

## Backend Implementation

### 1. Email Service (`server/emailService.ts`)
```typescript
- sendVerificationEmail(email, token, name)
- generateVerificationToken()
```

**Email Provider Options:**
- **Development**: Console logging (no actual email)
- **Production**: SMTP (Gmail, SendGrid, etc.)

### 2. Verification Endpoints (`server/standaloneAuth.ts`)
```typescript
- GET /api/auth/verify-email?token=xxx
  - Verify token validity
  - Check expiry (24 hours)
  - Mark user as verified
  - Create session
  - Redirect to vault

- POST /api/auth/resend-verification
  - Check if user exists
  - Check if already verified
  - Generate new token
  - Send new email
```

### 3. Update Registration Flow
```typescript
- After YubiKey registration:
  - Generate verification token
  - Store token and expiry in database
  - Send verification email
  - Create session (but mark as unverified)
  - Redirect to "check email" page
```

### 4. Update Login Flow
```typescript
- After YubiKey authentication:
  - Check if email is verified
  - If not verified: redirect to verification pending page
  - If verified: normal flow
```

### 5. Protected Route Middleware
```typescript
- Check if user session exists
- Check if user email is verified
- If not verified: return error or redirect
```

## Frontend Implementation

### 1. Verification Pending Page (`client/src/pages/VerifyEmail.tsx`)
```typescript
- Display "Check your email" message
- Show email address
- "Resend verification email" button
- "Change email" option (logout and re-register)
```

### 2. Verification Success Page (`client/src/pages/EmailVerified.tsx`)
```typescript
- Display success message
- Auto-redirect to vault after 3 seconds
- "Continue to Vault" button
```

### 3. Update Registration Flow
```typescript
- After successful YubiKey registration:
  - Redirect to /verify-email instead of /vault
```

### 4. Update Login Flow
```typescript
- After successful login:
  - Check verification status
  - If unverified: redirect to /verify-email
  - If verified: redirect to /vault
```

### 5. Update Vault Page
```typescript
- Add check for email verification
- If not verified: show banner with resend option
```

## Email Template

### Verification Email
```html
Subject: Verify your Bifrostvault account

Hi [Name],

Welcome to Bifrostvault! Please verify your email address to complete your registration.

Click the link below to verify your email:
[Verification Link]

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

Best regards,
Bifrostvault Team
```

## Environment Variables

Add to Railway:
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bifrostvault.com
SMTP_FROM_NAME=Bifrostvault

# Application URL (for verification links)
APP_URL=https://bifrostvault-production-71e0.up.railway.app
```

## Security Considerations

1. **Token Generation**: Use cryptographically secure random tokens
2. **Token Expiry**: 24-hour expiry for verification tokens
3. **Rate Limiting**: Limit resend requests (max 3 per hour)
4. **Single Use**: Tokens should be invalidated after use
5. **HTTPS Only**: Verification links must use HTTPS

## Development Mode

For development without email server:
- Log verification link to console
- Add `/dev/verify-email/:token` route for easy testing
- Display verification link in UI for testing

## Migration Strategy

### For Existing Users
- Set `emailVerified = TRUE` for all existing users
- Only new registrations require verification

### Backward Compatibility
- OAuth users automatically marked as verified
- Standalone auth users require verification

## Testing Checklist

- [ ] Register new account
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Account marked as verified
- [ ] Can access vault
- [ ] Try to login before verification
- [ ] Redirected to verification page
- [ ] Resend verification email
- [ ] Receive new email
- [ ] Verify with new link
- [ ] Token expiry works (24 hours)
- [ ] Invalid token shows error
- [ ] Already verified token shows message

## Implementation Order

1. Update database schema (add columns)
2. Create email service module
3. Update registration endpoint
4. Create verification endpoint
5. Create resend endpoint
6. Update login endpoint
7. Create verification pending page
8. Create verification success page
9. Update registration flow
10. Update login flow
11. Add protected route checks
12. Test thoroughly
13. Deploy

## Files to Create/Modify

### New Files
- `server/emailService.ts` - Email sending functionality
- `client/src/pages/VerifyEmail.tsx` - Verification pending page
- `client/src/pages/EmailVerified.tsx` - Verification success page

### Modified Files
- `drizzle/schema.ts` - Add verification columns
- `server/db.ts` - Add verification-related functions
- `server/standaloneAuth.ts` - Add verification endpoints
- `client/src/App.tsx` - Add verification routes
- `client/src/pages/Vault.tsx` - Add verification check

## Rollout Plan

### Phase 1: Development
- Implement with console logging
- Test locally

### Phase 2: Staging
- Deploy to Railway
- Test with real email service
- Verify all flows work

### Phase 3: Production
- Enable for new registrations
- Monitor for issues
- Collect user feedback
