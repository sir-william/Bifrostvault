import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';

// WebAuthn configuration
const RP_NAME = 'YubiPass Manager';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

export interface WebAuthnCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string | null;
  userVerified?: boolean;
  aaguid?: string;
  authenticatorType?: 'platform' | 'cross-platform';
}

// YubiKey AAGUIDs for detection
export const YUBIKEY_AAGUIDS = {
  BIO_SERIES: 'd8522d9f-575b-4866-88a9-ba99fa02f35b',
  YUBIKEY_5: 'cb69481e-8ff7-4039-93ec-0a2729a154a8',
  SECURITY_KEY: 'ee882879-721c-4913-9775-3dfcce97072a',
} as const;

export function detectYubiKeyType(aaguid: string): 'bio' | 'yubikey5' | 'securitykey' | 'unknown' {
  const aaguidLower = aaguid.toLowerCase();
  if (aaguidLower === YUBIKEY_AAGUIDS.BIO_SERIES) return 'bio';
  if (aaguidLower === YUBIKEY_AAGUIDS.YUBIKEY_5) return 'yubikey5';
  if (aaguidLower === YUBIKEY_AAGUIDS.SECURITY_KEY) return 'securitykey';
  return 'unknown';
}

/**
 * Generate registration options for a new WebAuthn credential
 */
export async function generateWebAuthnRegistrationOptions(
  userId: number,
  userName: string,
  userEmail?: string,
  existingCredentials: WebAuthnCredential[] = []
) {
  const opts: GenerateRegistrationOptionsOpts = {
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: userEmail || userName,
    userDisplayName: userName,
    // Timeout after 5 minutes
    timeout: 300000,
    // Prevent users from re-registering existing authenticators
    excludeCredentials: existingCredentials.map(cred => ({
      id: cred.credentialId,
      transports: cred.transports ? JSON.parse(cred.transports) : undefined,
    })),
    authenticatorSelection: {
      // Prefer platform authenticators (like Touch ID) but allow cross-platform (like YubiKey)
      authenticatorAttachment: 'cross-platform',
      // Require user verification (PIN, biometric, etc.)
      userVerification: 'preferred',
      // Require a resident key (credential stored on authenticator)
      residentKey: 'preferred',
    },
    attestationType: 'none',
  };

  return await generateRegistrationOptions(opts);
}

/**
 * Verify a WebAuthn registration response
 */
export async function verifyWebAuthnRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string
) {
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  };

  const verification = await verifyRegistrationResponse(opts);

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Registration verification failed');
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  
  // Extract AAGUID for YubiKey detection
  const aaguid = Buffer.from(credential.id).toString('hex').substring(0, 36);
  const keyType = detectYubiKeyType(aaguid);

  return {
    credentialId: Buffer.from(credential.id).toString('base64url'),
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: response.response.transports ? JSON.stringify(response.response.transports) : undefined,
    userVerified: verification.registrationInfo.userVerified,
    aaguid: aaguid,
    authenticatorType: credentialDeviceType,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    keyType,
  };
}

/**
 * Generate authentication options for WebAuthn login
 */
export async function generateWebAuthnAuthenticationOptions(
  existingCredentials: WebAuthnCredential[] = []
) {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: RP_ID,
    timeout: 300000,
    // Allow any credential if none are provided
    allowCredentials: existingCredentials.length > 0 
      ? existingCredentials.map(cred => ({
          id: cred.credentialId,
          transports: cred.transports ? JSON.parse(cred.transports) : undefined,
        }))
      : [],
    userVerification: 'preferred',
  };

  return await generateAuthenticationOptions(opts);
}

/**
 * Verify a WebAuthn authentication response
 */
export async function verifyWebAuthnAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credential: WebAuthnCredential
) {
  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: credential.credentialId,
      publicKey: Uint8Array.from(Buffer.from(credential.publicKey, 'base64url')),
      counter: credential.counter,
      transports: credential.transports ? JSON.parse(credential.transports) : undefined,
    },
  };

  const verification = await verifyAuthenticationResponse(opts);

  if (!verification.verified) {
    throw new Error('Authentication verification failed');
  }

  return {
    verified: true,
    newCounter: verification.authenticationInfo.newCounter,
    userVerified: verification.authenticationInfo.userVerified,
  };
}
