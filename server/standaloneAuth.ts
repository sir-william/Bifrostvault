import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as webauthn from "./webauthn";
import { generateVerificationToken, getTokenExpiry, sendVerificationEmail, isTokenExpired } from "./emailService";

// Store challenges temporarily (in production, use Redis or similar)
const challengeStore = new Map<string, { challenge: string, timestamp: number }>();
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Clean up expired challenges periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of challengeStore.entries()) {
    if (now - value.timestamp > CHALLENGE_EXPIRY_MS) {
      challengeStore.delete(key);
    }
  }
}, 60 * 1000); // Run every minute

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerStandaloneAuthRoutes(app: Express) {
  // Check if email exists
  app.get("/api/auth/check-email", async (req: Request, res: Response) => {
    const email = getQueryParam(req, "email");

    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    try {
      const user = await db.getUserByEmail(email);
      res.json({ exists: !!user });
    } catch (error) {
      console.error("[Auth] Check email failed", error);
      res.status(500).json({ error: "Failed to check email" });
    }
  });

  // Initialize registration - generate WebAuthn options
  app.post("/api/auth/register/init", async (req: Request, res: Response) => {
    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    try {
      // Check if email already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      // Generate WebAuthn registration options
      // Use email as temporary user ID for challenge storage
      const options = await webauthn.generateWebAuthnRegistrationOptions(
        0, // Temporary ID, will be replaced after user creation
        name || email,
        email,
        [] // No existing credentials for new user
      );

      // Store challenge with email as key
      challengeStore.set(`reg:${email}`, {
        challenge: options.challenge,
        timestamp: Date.now(),
      });

      res.json(options);
    } catch (error) {
      console.error("[Auth] Registration init failed", error);
      res.status(500).json({ error: "Failed to initialize registration" });
    }
  });

  // Complete registration - verify WebAuthn and create user
  app.post("/api/auth/register/complete", async (req: Request, res: Response) => {
    const { email, name, response: webauthnResponse } = req.body;

    if (!email || !webauthnResponse) {
      res.status(400).json({ error: "email and response are required" });
      return;
    }

    try {
      // Get stored challenge
      const storedData = challengeStore.get(`reg:${email}`);
      if (!storedData) {
        res.status(400).json({ error: "No registration in progress or challenge expired" });
        return;
      }

      const { challenge } = storedData;

      // Verify WebAuthn registration
      const verification = await webauthn.verifyWebAuthnRegistration(
        webauthnResponse,
        challenge
      );

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getTokenExpiry();

      // Create user with email as openId (to satisfy schema requirement)
      const openId = `email:${email}`; // Prefix to distinguish from OAuth openIds

      await db.upsertUser({
        openId,
        name: name || null,
        email,
        loginMethod: "webauthn",
        lastSignedIn: new Date(),
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
      });

      // Get the created user to get the ID
      const user = await db.getUserByEmail(email);
      if (!user) {
        throw new Error("Failed to create user");
      }

      // Save WebAuthn credential
      await db.addWebAuthnCredential({
        userId: user.id,
        credentialId: verification.credentialId,
        publicKey: verification.publicKey,
        counter: verification.counter,
        transports: verification.transports,
        name: "Primary YubiKey",
        aaguid: verification.aaguid,
        keyType: verification.keyType,
        userVerified: verification.userVerified || false,
        authenticatorType: verification.authenticatorType,
        lastVerified: verification.userVerified ? new Date() : undefined,
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken, name);
        console.log(`[Auth] Verification email sent to ${email}`);
      } catch (emailError) {
        console.error("[Auth] Failed to send verification email:", emailError);
        // Continue anyway - user can resend
      }

      // Create session token (but user still needs to verify email)
      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Clear challenge
      challengeStore.delete(`reg:${email}`);

      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email, name: user.name },
        emailVerified: false,
        message: "Registration successful. Please check your email to verify your account."
      });
    } catch (error) {
      console.error("[Auth] Registration complete failed", error);
      res.status(500).json({ error: "Failed to complete registration" });
    }
  });

  // Initialize login - generate WebAuthn authentication options
  app.post("/api/auth/login/init", async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    try {
      // Get user by email
      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(400).json({ error: "Email not registered" });
        return;
      }

      // Get user's WebAuthn credentials
      const credentials = await db.getWebAuthnCredentialsByUserId(user.id);
      if (credentials.length === 0) {
        res.status(400).json({ error: "No YubiKey registered for this account" });
        return;
      }

      // Generate WebAuthn authentication options
      const options = await webauthn.generateWebAuthnAuthenticationOptions(credentials);

      // Store challenge with email as key
      challengeStore.set(`login:${email}`, {
        challenge: options.challenge,
        timestamp: Date.now(),
      });

      res.json(options);
    } catch (error) {
      console.error("[Auth] Login init failed", error);
      res.status(500).json({ error: "Failed to initialize login" });
    }
  });

  // Complete login - verify WebAuthn and create session
  app.post("/api/auth/login/complete", async (req: Request, res: Response) => {
    const { email, response: webauthnResponse } = req.body;

    if (!email || !webauthnResponse) {
      res.status(400).json({ error: "email and response are required" });
      return;
    }

    try {
      // Get stored challenge
      const storedData = challengeStore.get(`login:${email}`);
      if (!storedData) {
        res.status(400).json({ error: "No login in progress or challenge expired" });
        return;
      }

      const { challenge } = storedData;

      // Get user
      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(400).json({ error: "Email not registered" });
        return;
      }

      // Get credential from database
      const credentialId = webauthnResponse.id;
      const credential = await db.getWebAuthnCredentialByCredentialId(credentialId);

      if (!credential) {
        res.status(400).json({ error: "Credential not found" });
        return;
      }

      // Verify WebAuthn authentication
      const verification = await webauthn.verifyWebAuthnAuthentication(
        webauthnResponse,
        challenge,
        {
          ...credential,
          transports: credential.transports || undefined,
        }
      );

      if (!verification.verified) {
        res.status(401).json({ error: "Authentication failed" });
        return;
      }

      // Update credential counter and last used
      await db.updateWebAuthnCredential(credential.id, {
        counter: verification.counter,
        lastUsed: new Date(),
        lastVerified: verification.userVerified ? new Date() : undefined,
      });

      // Update user last signed in
      await db.updateUserLastSignedIn(user.id);

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Clear challenge
      challengeStore.delete(`login:${email}`);

      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email, name: user.name },
        emailVerified: user.emailVerified || false
      });
    } catch (error) {
      console.error("[Auth] Login complete failed", error);
      res.status(500).json({ error: "Failed to complete login" });
    }
  });

  // Verify email with token
  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    const token = getQueryParam(req, "token");

    if (!token) {
      res.status(400).json({ error: "token is required" });
      return;
    }

    try {
      // Find user by verification token
      const user = await db.getUserByVerificationToken(token);
      
      if (!user) {
        res.status(400).json({ error: "Invalid verification token" });
        return;
      }

      // Check if token has expired
      if (isTokenExpired(user.verificationTokenExpiry)) {
        res.status(400).json({ error: "Verification token has expired" });
        return;
      }

      // Check if already verified
      if (user.emailVerified) {
        res.status(400).json({ error: "Email already verified", alreadyVerified: true });
        return;
      }

      // Mark email as verified and clear token
      await db.verifyUserEmail(user.id);

      // Create session token
      const openId = user.openId;
      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ 
        success: true, 
        message: "Email verified successfully",
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      console.error("[Auth] Email verification failed", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    try {
      // Get user by email
      const user = await db.getUserByEmail(email);
      
      if (!user) {
        res.status(400).json({ error: "Email not registered" });
        return;
      }

      // Check if already verified
      if (user.emailVerified) {
        res.status(400).json({ error: "Email already verified", alreadyVerified: true });
        return;
      }

      // Generate new verification token
      const token = generateVerificationToken();
      const expiry = getTokenExpiry();

      // Update user with new token
      await db.updateVerificationToken(user.id, token, expiry);

      // Send verification email
      await sendVerificationEmail(user.email!, token, user.name);

      res.json({ success: true, message: "Verification email sent" });
    } catch (error) {
      console.error("[Auth] Resend verification failed", error);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });
}
