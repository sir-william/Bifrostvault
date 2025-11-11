import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as webauthn from "./webauthn";

// Store challenges temporarily (in production, use Redis or similar)
const challengeStore = new Map<number, string>();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  webauthn: router({
    // Generate registration options
    generateRegistrationOptions: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      const existingCredentials = await db.getWebAuthnCredentialsByUserId(user.id);
      
      const options = await webauthn.generateWebAuthnRegistrationOptions(
        user.id,
        user.name || 'User',
        user.email || undefined,
        existingCredentials
      );

      // Store challenge for verification
      challengeStore.set(user.id, options.challenge);

      return options;
    }),

    // Verify registration response
    verifyRegistration: protectedProcedure
      .input(z.object({
        response: z.any(),
        name: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const expectedChallenge = challengeStore.get(user.id);

        if (!expectedChallenge) {
          throw new Error('No challenge found for user');
        }

        const verification = await webauthn.verifyWebAuthnRegistration(
          input.response,
          expectedChallenge
        );

        // Save credential to database
        await db.addWebAuthnCredential({
          userId: user.id,
          credentialId: verification.credentialId,
          publicKey: verification.publicKey,
          counter: verification.counter,
          transports: verification.transports,
          name: input.name || 'YubiKey',
          aaguid: verification.aaguid,
          keyType: verification.keyType,
          userVerified: verification.userVerified || false,
          authenticatorType: verification.authenticatorType,
          lastVerified: verification.userVerified ? new Date() : undefined,
        });

        // Clear challenge
        challengeStore.delete(user.id);

        return { success: true };
      }),

    // Generate authentication options
    generateAuthenticationOptions: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      const existingCredentials = await db.getWebAuthnCredentialsByUserId(user.id);

      const options = await webauthn.generateWebAuthnAuthenticationOptions(existingCredentials);

      // Store challenge for verification
      challengeStore.set(user.id, options.challenge);

      return options;
    }),

    // Verify authentication response
    verifyAuthentication: protectedProcedure
      .input(z.object({
        response: z.any(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const expectedChallenge = challengeStore.get(user.id);

        if (!expectedChallenge) {
          throw new Error('No challenge found for user');
        }

        // Get credential from database
        const credentialId = input.response.id;
        const credential = await db.getWebAuthnCredentialByCredentialId(credentialId);

        if (!credential) {
          throw new Error('Credential not found');
        }

        const verification = await webauthn.verifyWebAuthnAuthentication(
          input.response,
          expectedChallenge,
          {
            ...credential,
            transports: credential.transports || undefined,
          }
        );

        // Update counter and verification status
        await db.updateWebAuthnCredentialCounter(
          credential.credentialId,
          verification.newCounter,
          verification.userVerified
        );

        // Clear challenge
        challengeStore.delete(user.id);

        return { success: true, verified: verification.verified };
      }),

    // List user's credentials
    listCredentials: protectedProcedure.query(async ({ ctx }) => {
      const credentials = await db.getWebAuthnCredentialsByUserId(ctx.user.id);
      return credentials.map(cred => ({
        id: cred.id,
        name: cred.name,
        createdAt: cred.createdAt,
        lastUsed: cred.lastUsed,
        keyType: cred.keyType,
        aaguid: cred.aaguid,
        userVerified: cred.userVerified,
        authenticatorType: cred.authenticatorType,
        lastVerified: cred.lastVerified,
      }));
    }),

    // Get credential info (for Bio-specific features)
    getCredentialInfo: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const credentials = await db.getWebAuthnCredentialsByUserId(ctx.user.id);
        const credential = credentials.find(c => c.id === input.id);
        
        if (!credential) {
          throw new Error('Credential not found');
        }

        const isBio = credential.keyType === 'bio';
        const maxCredentials = isBio ? 25 : 100; // Bio firmware 5.5.6 = 25, 5.7+ = 100

        return {
          id: credential.id,
          name: credential.name,
          keyType: credential.keyType,
          isBio,
          maxCredentials,
          currentCount: credentials.length,
          userVerified: credential.userVerified,
          lastVerified: credential.lastVerified,
        };
      }),
  }),

  vault: router({
    // List all vault entries
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getVaultEntriesByUserId(ctx.user.id);
    }),

    // Add new vault entry
    add: protectedProcedure
      .input(z.object({
        type: z.enum(['login', 'note', 'card', 'identity']).default('login'),
        encryptedName: z.string(),
        encryptedUsername: z.string().optional(),
        encryptedPassword: z.string().optional(),
        encryptedUrl: z.string().optional(),
        encryptedNotes: z.string().optional(),
        encryptedCustomFields: z.string().optional(),
        isFavorite: z.boolean().default(false),
        folder: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addVaultEntry({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    // Update vault entry
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        encryptedName: z.string().optional(),
        encryptedUsername: z.string().optional(),
        encryptedPassword: z.string().optional(),
        encryptedUrl: z.string().optional(),
        encryptedNotes: z.string().optional(),
        encryptedCustomFields: z.string().optional(),
        isFavorite: z.boolean().optional(),
        folder: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateVaultEntry(id, ctx.user.id, updates);
        return { success: true };
      }),

    // Delete vault entry
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteVaultEntry(input.id, ctx.user.id);
        return { success: true };
      }),

    // Mark entry as accessed
    markAccessed: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateVaultEntryLastAccessed(input.id);
        return { success: true };
      }),
  }),

  // TOTP (Two-Factor Authentication)
  totp: router({
    // Generate new TOTP secret and QR code
    setup: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      const totp = await import('./totp');
      
      // Generate secret and QR code
      const { secret, otpauthUrl } = totp.generateTOTPSecret(user.email || user.name || 'User');
      const qrCode = await totp.generateQRCode(otpauthUrl);
      const backupCodes = totp.generateBackupCodes(10);
      
      // Hash backup codes for storage
      const hashedBackupCodes = backupCodes.map(code => totp.hashBackupCode(code));
      
      // Save to database (not enabled yet)
      await db.upsertTotpSecret({
        userId: user.id,
        secret,
        backupCodes: JSON.stringify(hashedBackupCodes),
        enabled: 0,
      });
      
      return {
        secret,
        qrCode,
        backupCodes, // Return unhashed codes for user to save
      };
    }),
    
    // Enable TOTP after verifying first token
    enable: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const totp = await import('./totp');
        
        const totpData = await db.getTotpSecret(user.id);
        if (!totpData) {
          throw new Error('TOTP not set up. Call setup first.');
        }
        
        // Verify token
        const verified = totp.verifyTOTPToken(totpData.secret, input.token);
        if (!verified) {
          throw new Error('Invalid TOTP token');
        }
        
        // Enable TOTP
        await db.upsertTotpSecret({
          ...totpData,
          enabled: 1,
          lastUsed: new Date(),
        });
        
        return { success: true };
      }),
    
    // Verify TOTP token
    verify: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const totp = await import('./totp');
        
        const totpData = await db.getTotpSecret(user.id);
        if (!totpData || !totpData.enabled) {
          throw new Error('TOTP not enabled');
        }
        
        // Verify token
        const verified = totp.verifyTOTPToken(totpData.secret, input.token);
        if (verified) {
          await db.updateTotpLastUsed(user.id);
          return { verified: true };
        }
        
        return { verified: false };
      }),
    
    // Verify backup code
    verifyBackupCode: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        const totp = await import('./totp');
        
        const totpData = await db.getTotpSecret(user.id);
        if (!totpData || !totpData.enabled || !totpData.backupCodes) {
          throw new Error('TOTP not enabled or no backup codes');
        }
        
        const hashedCodes: string[] = JSON.parse(totpData.backupCodes);
        
        // Check if code matches any backup code
        for (let i = 0; i < hashedCodes.length; i++) {
          if (totp.verifyBackupCode(input.code, hashedCodes[i])) {
            // Remove used backup code
            hashedCodes.splice(i, 1);
            await db.upsertTotpSecret({
              ...totpData,
              backupCodes: JSON.stringify(hashedCodes),
              lastUsed: new Date(),
            });
            
            return { verified: true, remainingCodes: hashedCodes.length };
          }
        }
        
        return { verified: false };
      }),
    
    // Get TOTP status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      const totpData = await db.getTotpSecret(user.id);
      
      if (!totpData) {
        return { enabled: false, backupCodesCount: 0 };
      }
      
      const backupCodes = totpData.backupCodes ? JSON.parse(totpData.backupCodes) : [];
      
      return {
        enabled: totpData.enabled === 1,
        backupCodesCount: backupCodes.length,
        lastUsed: totpData.lastUsed,
      };
    }),
    
    // Disable TOTP
    disable: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      
      await db.upsertTotpSecret({
        userId: user.id,
        secret: '',
        backupCodes: null,
        enabled: 0,
      });
      
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
