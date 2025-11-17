/**
 * Standalone Google OAuth Authentication
 * 
 * This module provides direct Google OAuth integration without relying on
 * any external OAuth portal or agent infrastructure.
 */

import { OAuth2Client } from 'google-auth-library';
import type { Express, Request, Response } from 'express';
import * as db from './db';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';
import { getSessionCookieOptions } from './_core/cookies';
import { SignJWT } from 'jose';
import { ENV } from './_core/env';

// Google OAuth Client
let googleClient: OAuth2Client | null = null;

function getGoogleClient(): OAuth2Client {
  if (!googleClient) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
    }

    googleClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  return googleClient;
}

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(): string {
  const client = getGoogleClient();
  
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
  });
}

/**
 * Create session token for user
 */
async function createSessionToken(email: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);

  return new SignJWT({
    email,
    name,
    appId: ENV.appId,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expirationSeconds)
    .sign(secret);
}

/**
 * Register Google OAuth routes
 */
export function registerGoogleAuthRoutes(app: Express) {
  // Initiate Google OAuth
  app.get('/api/auth/google', (req: Request, res: Response) => {
    try {
      const authUrl = getGoogleAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error('[Google Auth] Failed to generate auth URL:', error);
      res.status(500).json({ error: 'Failed to initiate Google authentication' });
    }
  });

  // Google OAuth callback
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const error = req.query.error as string;

    // Handle user cancellation
    if (error) {
      console.log('[Google Auth] User cancelled:', error);
      return res.redirect('/?error=auth_cancelled');
    }

    if (!code) {
      console.error('[Google Auth] No code provided');
      return res.redirect('/?error=no_code');
    }

    try {
      const client = getGoogleClient();

      // Exchange code for tokens
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Get user info
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('No payload in ID token');
      }

      const { email, name, sub: googleId, email_verified } = payload;

      if (!email || !email_verified) {
        return res.redirect('/?error=email_not_verified');
      }

      console.log('[Google Auth] User authenticated:', { email, name, googleId });

      // Create or update user in database
      // Use email as the primary identifier for standalone auth
      let user = await db.getUserByEmail(email);

      if (!user) {
        // Create new user
        console.log('[Google Auth] Creating new user:', email);
        
        // For Google auth, we'll use email as openId since we're standalone
        await db.upsertUser({
          openId: `google:${googleId}`,
          email,
          name: name || null,
          loginMethod: 'google',
          lastSignedIn: new Date(),
          emailVerified: true, // Google already verified the email
        });

        user = await db.getUserByEmail(email);
      } else {
        // Update existing user
        console.log('[Google Auth] Updating existing user:', email);
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
          loginMethod: 'google',
        });
      }

      if (!user) {
        throw new Error('Failed to create or retrieve user');
      }

      // Create session token
      const sessionToken = await createSessionToken(email, name || email);

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log('[Google Auth] Session created, redirecting to vault');

      // Redirect to vault
      res.redirect('/vault');
    } catch (error) {
      console.error('[Google Auth] Callback failed:', error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Get current user info (for API calls)
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const sessionCookie = req.cookies[COOKIE_NAME];
      
      if (!sessionCookie) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Verify session token
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(sessionCookie, secret, {
        algorithms: ['HS256'],
      });

      const { email, name } = payload as { email: string; name: string };

      if (!email) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const user = await db.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        email: user.email,
        name: user.name,
        loginMethod: user.loginMethod,
      });
    } catch (error) {
      console.error('[Google Auth] Failed to get user info:', error);
      res.status(401).json({ error: 'Invalid session' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });
}
