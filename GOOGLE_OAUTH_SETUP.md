# Google OAuth Setup Guide

## Overview

This guide explains how to set up Google OAuth authentication for Bifrostvault. This is a **standalone implementation** that doesn't rely on any external OAuth portal or agent infrastructure.

## Prerequisites

- Google Cloud Platform account
- Bifrostvault deployed on Railway or accessible via public URL

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `Bifrostvault`
4. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **"External"** (unless you have a Google Workspace)
3. Click **"Create"**

### App Information
- **App name**: `Bifrostvault`
- **User support email**: Your email
- **App logo**: (Optional) Upload your app logo
- **Application home page**: `https://bifrostvault-production-71e0.up.railway.app`
- **Application privacy policy link**: (Optional)
- **Application terms of service link**: (Optional)
- **Authorized domains**: `up.railway.app`
- **Developer contact information**: Your email

4. Click **"Save and Continue"**

### Scopes
1. Click **"Add or Remove Scopes"**
2. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. Click **"Update"**
4. Click **"Save and Continue"**

### Test Users (Optional for Development)
1. Click **"Add Users"**
2. Add your email address for testing
3. Click **"Save and Continue"**

4. Review and click **"Back to Dashboard"**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**

### Configure OAuth Client

**Name**: `Bifrostvault Web Client`

**Authorized JavaScript origins**:
```
https://bifrostvault-production-71e0.up.railway.app
```

**Authorized redirect URIs**:
```
https://bifrostvault-production-71e0.up.railway.app/api/auth/google/callback
```

For local development, also add:
```
http://localhost:3000
http://localhost:3000/api/auth/google/callback
```

4. Click **"Create"**
5. **Copy the Client ID and Client Secret** (you'll need these!)

## Step 5: Configure Railway Environment Variables

Go to your Railway project → Bifrostvault service → Variables tab and add:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://bifrostvault-production-71e0.up.railway.app/api/auth/google/callback

# Application URL (for redirects)
APP_URL=https://bifrostvault-production-71e0.up.railway.app

# Session Secret (already set, but verify)
JWT_SECRET=your-existing-jwt-secret
```

## Step 6: Test the Integration

1. **Deploy the application** (Railway will auto-deploy after adding variables)
2. Go to your application URL
3. Click **"Sign in with Google"**
4. You should be redirected to Google's consent screen
5. Grant permissions
6. You should be redirected back to `/vault` with a session cookie

## Troubleshooting

### Error: redirect_uri_mismatch

**Problem**: The redirect URI in your Google OAuth request doesn't match the authorized URIs.

**Solution**:
1. Check that `GOOGLE_REDIRECT_URI` exactly matches one of the authorized redirect URIs in Google Cloud Console
2. Make sure there are no trailing slashes
3. Verify the protocol (http vs https)

### Error: access_denied

**Problem**: User cancelled the OAuth flow or doesn't have permission.

**Solution**:
- If in development mode, make sure the user is added to "Test users" in OAuth consent screen
- Check that the OAuth consent screen is configured correctly

### Error: invalid_client

**Problem**: Client ID or Client Secret is incorrect.

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway
2. Make sure there are no extra spaces or newlines
3. Regenerate credentials if necessary

### User gets stuck after consent

**Problem**: OAuth callback isn't handling the response correctly.

**Solution**:
1. Check Railway logs for errors
2. Verify database connection
3. Ensure `JWT_SECRET` is set
4. Check that `APP_URL` is correct

## Security Best Practices

### 1. Keep Secrets Secure
- Never commit `GOOGLE_CLIENT_SECRET` to git
- Use Railway's environment variables
- Rotate secrets periodically

### 2. Use HTTPS in Production
- Always use HTTPS for production URLs
- Railway provides HTTPS by default

### 3. Validate Redirect URIs
- Only add necessary redirect URIs
- Don't use wildcards
- Keep the list minimal

### 4. Monitor OAuth Usage
- Check Google Cloud Console for usage metrics
- Set up alerts for unusual activity
- Review OAuth consent screen periodically

## OAuth Flow

### 1. User Clicks "Sign in with Google"
```
GET /api/auth/google
```
- Server generates Google OAuth URL
- Redirects user to Google consent screen

### 2. User Grants Permission
- Google shows consent screen
- User approves requested scopes
- Google redirects back with authorization code

### 3. Callback Handling
```
GET /api/auth/google/callback?code=...
```
- Server exchanges code for tokens
- Server verifies ID token
- Server extracts user info (email, name, Google ID)
- Server creates or updates user in database
- Server creates session token
- Server sets session cookie
- Server redirects to `/vault`

### 4. Authenticated Session
- User is now logged in
- Session cookie is valid for 1 year
- User can access protected routes

## API Endpoints

### Initiate Google OAuth
```
GET /api/auth/google
```
Redirects to Google consent screen.

### OAuth Callback
```
GET /api/auth/google/callback?code=...&state=...
```
Handles OAuth callback, creates session, redirects to vault.

### Get Current User
```
GET /api/auth/me
```
Returns current user info if authenticated.

**Response:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "loginMethod": "google"
}
```

### Logout
```
POST /api/auth/logout
```
Clears session cookie.

## Database Schema

Users authenticated via Google are stored with:

```typescript
{
  openId: "google:1234567890",  // Google user ID
  email: "user@example.com",
  name: "User Name",
  loginMethod: "google",
  emailVerified: true,          // Google already verified
  lastSignedIn: Date,
}
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret from Google Cloud Console | `GOCSPX-abc123...` |
| `GOOGLE_REDIRECT_URI` | Callback URL for OAuth | `https://your-app.railway.app/api/auth/google/callback` |
| `APP_URL` | Your application's base URL | `https://your-app.railway.app` |
| `JWT_SECRET` | Secret for signing session tokens | (already configured) |

## Testing Locally

### 1. Set up local environment variables

Create `.env.local`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
APP_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
```

### 2. Add localhost to authorized origins

In Google Cloud Console, add:
- `http://localhost:3000` to Authorized JavaScript origins
- `http://localhost:3000/api/auth/google/callback` to Authorized redirect URIs

### 3. Run the development server

```bash
pnpm dev
```

### 4. Test the flow

1. Go to `http://localhost:3000`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should redirect to `/vault`

## Production Deployment

### 1. Set Railway environment variables

All the variables listed above should be set in Railway.

### 2. Deploy

```bash
git push origin main
```

Railway will automatically deploy.

### 3. Verify

1. Visit your Railway URL
2. Test Google Sign-In
3. Check logs for any errors

## Support

If you encounter issues:

1. Check Railway logs: `railway logs`
2. Check Google Cloud Console → APIs & Services → Credentials
3. Verify all environment variables are set correctly
4. Ensure database is accessible
5. Check that HTTPS is enabled (Railway default)

## Summary

You now have a **standalone Google OAuth implementation** that:

✅ Works independently without external OAuth portals
✅ Authenticates users via Google
✅ Creates secure sessions
✅ Stores users in your database
✅ Redirects to vault after login
✅ Supports both development and production environments

Users can now sign in with their Google account and access Bifrostvault!
