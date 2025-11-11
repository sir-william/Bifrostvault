/**
 * WebAuthn Mock Helper for E2E Testing
 * 
 * This helper provides mock implementations of WebAuthn APIs for testing
 * YubiKey authentication without requiring physical hardware.
 */

import { Page } from '@playwright/test';

export interface MockYubiKeyOptions {
  type?: 'bio' | 'yubikey5' | 'securitykey';
  userVerification?: boolean;
  aaguid?: string;
}

const AAGUIDS = {
  bio: 'd8522d9f-575b-4866-88a9-ba99fa02f35b',
  yubikey5: 'cb69481e-8ff7-4039-93ec-0a2729a154a8',
  securitykey: 'ee882879-721c-4913-9775-3dfcce97072a',
};

/**
 * Install WebAuthn mock in the browser context
 */
export async function installWebAuthnMock(page: Page, options: MockYubiKeyOptions = {}) {
  const { 
    type = 'yubikey5', 
    userVerification = false,
    aaguid = AAGUIDS[type]
  } = options;

  await page.addInitScript((opts) => {
    // Store original navigator.credentials
    const originalCredentials = navigator.credentials;

    // Mock credential data
    const mockCredentialId = new Uint8Array(32);
    crypto.getRandomValues(mockCredentialId);

    const mockPublicKey = new Uint8Array(65);
    crypto.getRandomValues(mockPublicKey);

    // Mock AAGUID
    const aaguidBytes = new Uint8Array(16);
    const aaguidHex = opts.aaguid.replace(/-/g, '');
    for (let i = 0; i < 16; i++) {
      aaguidBytes[i] = parseInt(aaguidHex.substr(i * 2, 2), 16);
    }

    // Override navigator.credentials
    Object.defineProperty(navigator, 'credentials', {
      value: {
        ...originalCredentials,
        
        // Mock create (registration)
        create: async (options: any) => {
          console.log('[WebAuthn Mock] create() called', options);
          
          // Simulate user interaction delay
          await new Promise(resolve => setTimeout(resolve, 500));

          const challenge = new Uint8Array(options.publicKey.challenge);
          const clientDataJSON = JSON.stringify({
            type: 'webauthn.create',
            challenge: btoa(String.fromCharCode(...challenge)),
            origin: window.location.origin,
            crossOrigin: false,
          });

          // Create authenticator data
          const rpIdHash = new Uint8Array(32);
          crypto.getRandomValues(rpIdHash);

          const flags = opts.userVerification ? 0x45 : 0x41; // UP + UV or just UP
          const counter = new Uint8Array(4);
          
          const authenticatorData = new Uint8Array([
            ...rpIdHash,
            flags,
            ...counter,
            ...aaguidBytes,
            0, 32, // credential ID length
            ...mockCredentialId,
            ...mockPublicKey,
          ]);

          return {
            id: btoa(String.fromCharCode(...mockCredentialId)),
            rawId: mockCredentialId.buffer,
            type: 'public-key',
            response: {
              clientDataJSON: new TextEncoder().encode(clientDataJSON).buffer,
              attestationObject: authenticatorData.buffer,
              getTransports: () => ['usb', 'nfc'],
              getAuthenticatorData: () => authenticatorData.buffer,
              getPublicKey: () => mockPublicKey.buffer,
              getPublicKeyAlgorithm: () => -7, // ES256
            },
          };
        },

        // Mock get (authentication)
        get: async (options: any) => {
          console.log('[WebAuthn Mock] get() called', options);
          
          // Simulate user interaction delay
          await new Promise(resolve => setTimeout(resolve, 500));

          const challenge = new Uint8Array(options.publicKey.challenge);
          const clientDataJSON = JSON.stringify({
            type: 'webauthn.get',
            challenge: btoa(String.fromCharCode(...challenge)),
            origin: window.location.origin,
            crossOrigin: false,
          });

          // Create authenticator data
          const rpIdHash = new Uint8Array(32);
          crypto.getRandomValues(rpIdHash);

          const flags = opts.userVerification ? 0x05 : 0x01; // UP + UV or just UP
          const counter = new Uint8Array(4);
          counter[3] = 1; // Counter = 1

          const authenticatorData = new Uint8Array([
            ...rpIdHash,
            flags,
            ...counter,
          ]);

          // Create signature
          const signature = new Uint8Array(64);
          crypto.getRandomValues(signature);

          return {
            id: btoa(String.fromCharCode(...mockCredentialId)),
            rawId: mockCredentialId.buffer,
            type: 'public-key',
            response: {
              clientDataJSON: new TextEncoder().encode(clientDataJSON).buffer,
              authenticatorData: authenticatorData.buffer,
              signature: signature.buffer,
              userHandle: new Uint8Array([1, 2, 3, 4]).buffer,
            },
          };
        },
      },
      configurable: true,
    });

    console.log('[WebAuthn Mock] Installed successfully', {
      type: opts.type,
      userVerification: opts.userVerification,
      aaguid: opts.aaguid,
    });
  }, { type, userVerification, aaguid });
}

/**
 * Simulate YubiKey Bio fingerprint authentication
 */
export async function simulateBiometricAuth(page: Page, success: boolean = true) {
  await page.evaluate((shouldSucceed) => {
    console.log(`[WebAuthn Mock] Simulating biometric auth: ${shouldSucceed ? 'success' : 'failure'}`);
    
    if (!shouldSucceed) {
      throw new Error('Biometric authentication failed');
    }
  }, success);
}

/**
 * Simulate YubiKey Bio blocked state (after 3 failed attempts)
 */
export async function simulateBiometricBlocked(page: Page) {
  await page.evaluate(() => {
    console.log('[WebAuthn Mock] Simulating biometric blocked state');
    throw new Error('Biometric authentication is blocked. Please use PIN.');
  });
}

/**
 * Wait for WebAuthn operation to complete
 */
export async function waitForWebAuthnOperation(page: Page, timeout: number = 5000) {
  await page.waitForTimeout(timeout);
}

/**
 * Get mock credential info
 */
export function getMockCredentialInfo(type: 'bio' | 'yubikey5' | 'securitykey') {
  return {
    type,
    aaguid: AAGUIDS[type],
    maxCredentials: type === 'bio' ? 25 : 100,
    supportsUserVerification: type === 'bio',
  };
}
