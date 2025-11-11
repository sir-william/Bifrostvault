# Security Key Setup Guide for Bifrostvault

This guide covers setup and usage of Yubico Security Key series with Bifrostvault, including Security Key C NFC, Security Key NFC, and Security Key A models.

---

## What is Security Key?

The Security Key series from Yubico provides FIDO2/WebAuthn and U2F authentication in a compact, affordable form factor. While it lacks the additional protocols found in YubiKey 5 series (like PIV, OATH, OpenPGP), it excels at passwordless web authentication.

### Key Features

**FIDO2/WebAuthn Support**: Full support for modern passwordless authentication standards, making it compatible with Bifrostvault and hundreds of other services.

**U2F Support**: Backward compatibility with Universal 2nd Factor (U2F) protocol for older services.

**NFC Capability** (on NFC models): Tap-and-go authentication with NFC-enabled smartphones and tablets.

**Compact Design**: Smaller than standard YubiKeys, perfect for leaving in a laptop or carrying on a keychain.

**Water and Crush Resistant**: Durable construction withstands everyday wear and tear.

---

## Supported Models

Bifrostvault supports all Security Key models:

| Model | Interface | NFC | Firmware | Status |
|-------|-----------|-----|----------|--------|
| Security Key C NFC | USB-C | ✅ Yes | 5.4.3+ | ✅ Fully Supported |
| Security Key NFC | USB-A | ✅ Yes | 5.2.4+ | ✅ Fully Supported |
| Security Key A | USB-A | ❌ No | 5.1.2+ | ✅ Fully Supported |

---

## Prerequisites

Before setting up your Security Key with Bifrostvault:

1. **Security Key Device**: A physical Security Key from Yubico
2. **Modern Browser**: Chrome 90+, Firefox 90+, Edge 90+, or Safari 14+
3. **Bifrostvault Account**: Create an account if you haven't already

**Note**: Unlike YubiKey Bio, Security Key does not require PIN setup or fingerprint enrollment for basic FIDO2 usage. However, setting a PIN is recommended for enhanced security.

---

## Step 1: Optional PIN Setup

While not required, setting a FIDO2 PIN adds an extra layer of security to your Security Key.

### Why Set a PIN?

**User Verification**: A PIN enables user verification, proving that you (not just someone with your key) are authenticating.

**Discoverable Credentials**: PIN is required to create discoverable credentials (passwordless login).

**Theft Protection**: If someone steals your Security Key, they cannot use it without your PIN.

### Setting a PIN

#### Using Chrome Browser

1. **Open Chrome** and navigate to `chrome://settings/securityKeys`
2. **Click "Manage security keys"**
3. **Insert your Security Key** when prompted
4. **Click "Create a PIN"**
5. **Enter a PIN** (4-63 characters)
6. **Confirm your PIN**
7. **Click "OK"** to save

#### Using Windows 10/11

1. **Open Windows Settings** → **Accounts** → **Sign-in options**
2. **Click "Security Key"** → **Manage**
3. **Insert your Security Key** when prompted
4. **Click "Set up a PIN"**
5. **Enter and confirm your PIN**
6. **Click "OK"**

#### Using Yubico Authenticator

1. **Download Yubico Authenticator** from [yubico.com](https://www.yubico.com/products/yubico-authenticator/)
2. **Install and launch** the application
3. **Insert your Security Key**
4. **Navigate to FIDO2** → **Set PIN**
5. **Enter and confirm your PIN**
6. **Click "Set PIN"**

### PIN Requirements

- **Length**: 4-63 characters (letters, numbers, symbols)
- **Recommendation**: Use 6-8 characters for balance of security and usability
- **Lockout**: After 8 incorrect attempts, FIDO2 application locks

---

## Step 2: Register Security Key with Bifrostvault

### Registration Process

1. **Log in to Bifrostvault** using your OAuth credentials
2. **Navigate to Settings** → **YubiKey Setup**
3. **Insert your Security Key** into a USB port (or prepare for NFC tap on mobile)
4. **Enter a name** for your key (e.g., "Security Key C NFC - Primary")
5. **Click "Register YubiKey"**
6. **Touch the gold contact** when your browser prompts
7. **Enter PIN if prompted** (if you set one in Step 1)
8. **Wait for confirmation** that registration was successful

### What Happens During Registration

The registration process creates a unique credential pair:

1. **Challenge Generation**: Bifrostvault server creates a cryptographic challenge
2. **Browser Prompt**: WebAuthn API displays a security key prompt
3. **User Presence**: You touch the gold contact to confirm presence
4. **Key Signing**: Security Key signs the challenge with its private key
5. **Credential Storage**: Bifrostvault stores the public key
6. **Confirmation**: Success message appears

The entire process takes just a few seconds.

---

## Step 3: Using Security Key for Authentication

### Desktop Authentication

1. **Navigate to Bifrostvault** login page
2. **Click "Sign In"** and complete OAuth if required
3. **Insert your Security Key** when prompted
4. **Touch the gold contact** on the key
5. **Enter PIN if prompted** (if user verification is required)
6. **Access your vault** immediately

### Mobile Authentication (NFC Models)

For Security Key C NFC or Security Key NFC:

#### Android

1. **Open Bifrostvault** in Chrome or Firefox on Android
2. **Tap "Sign In"** and complete authentication flow
3. **When prompted, tap your Security Key** to the back of your phone
4. **Hold steady** for 1-2 seconds
5. **Authentication completes** automatically

#### iOS

1. **Open Bifrostvault** in Safari on iOS 16+
2. **Tap "Sign In"** and complete authentication flow
3. **When prompted, tap your Security Key** to the back of your iPhone
4. **Hold steady** for 1-2 seconds
5. **Authentication completes** automatically

### Touch Indicator

The Security Key provides visual feedback:

- **Flashing slowly**: Waiting for touch
- **Solid for 1 second**: Touch registered, authentication successful
- **Flashing rapidly**: Error or timeout

---

## Managing Multiple Security Keys

### Registering Backup Keys

We strongly recommend registering at least two Security Keys:

1. **Primary Key**: Keep with you for daily use (on keychain, in laptop, etc.)
2. **Backup Key**: Store securely at home or in a safe location

To register a second key:

1. **Navigate to Settings** → **YubiKey Setup**
2. **Insert your backup Security Key**
3. **Enter a descriptive name** (e.g., "Security Key - Backup")
4. **Click "Register YubiKey"**
5. **Touch the key** when prompted

### Viewing Registered Keys

To see all your registered keys:

1. **Navigate to Settings** → **YubiKey Setup**
2. **View the list** showing:
   - Key name
   - Key type (Security Key)
   - Registration date
   - Last used timestamp

### Removing a Key

If you lose a key or want to remove it:

1. **Log in with another registered key**
2. **Navigate to Settings** → **YubiKey Setup**
3. **Find the key** in the list
4. **Click "Remove"** button
5. **Confirm removal**

**Important**: Always ensure you have at least one key registered before removing others.

---

## Troubleshooting

### Security Key Not Detected

If your browser doesn't detect your Security Key:

**Check USB connection**: Ensure the key is fully inserted into the USB port.

**Try different port**: Some USB ports may have connectivity issues, especially USB 3.0 ports with USB-A adapters.

**Check browser support**: Ensure you're using a supported browser with WebAuthn enabled.

**Restart browser**: Close and reopen your browser to reset the WebAuthn state.

**Check permissions**: Ensure the website has permission to access security keys (check browser address bar for blocked permissions).

### Touch Not Recognized

If touching the gold contact doesn't work:

**Touch firmly**: Press the gold contact with your finger for at least 1 second.

**Clean the contact**: Use a soft cloth to clean the gold contact area.

**Check for damage**: Inspect the key for physical damage.

**Try different finger**: Some materials (gloves, bandages) may interfere with capacitive touch.

### NFC Not Working (Mobile)

If NFC authentication fails on mobile:

**Enable NFC**: Check that NFC is enabled in your phone's settings.

**Remove case**: Thick phone cases may block NFC signal.

**Position correctly**: Tap the Security Key to the back of your phone near the NFC antenna (usually center or top).

**Hold steady**: Keep the key in contact for 1-2 seconds without moving.

**Check browser**: Use Chrome on Android or Safari on iOS 16+ for best NFC support.

### PIN Forgotten

If you forget your FIDO2 PIN:

**Warning**: There is no way to recover a forgotten PIN. You must reset the FIDO2 application, which deletes all credentials.

To reset:

1. **Use Chrome** and navigate to `chrome://settings/securityKeys`
2. **Click "Manage security keys"** → **"Reset"**
3. **Insert your Security Key** and confirm reset
4. **Set a new PIN**
5. **Re-register** with all services (including Bifrostvault)

### Registration Fails

If registration fails in Bifrostvault:

**Check HTTPS**: WebAuthn requires a secure context (HTTPS or localhost).

**Check browser compatibility**: Ensure your browser supports WebAuthn.

**Clear browser data**: Clear cookies and cache, then try again.

**Try incognito mode**: Test in a private/incognito window to rule out extensions.

**Check for conflicts**: Disable browser extensions that might interfere with WebAuthn.

---

## Security Considerations

### Physical Security

**Treat like a key**: Your Security Key is a physical authentication factor. Keep it secure and don't lend it to others.

**Register backup keys**: Always have at least two keys registered in case one is lost or damaged.

**Report lost keys**: If you lose a Security Key, immediately log in with your backup and remove the lost key from your account.

### PIN Security

**Use a strong PIN**: If you set a PIN, make it memorable but not easily guessable.

**Don't share your PIN**: Never share your PIN with anyone.

**Beware of shoulder surfing**: Be aware of your surroundings when entering your PIN.

### Best Practices

**Keep firmware updated**: Check for firmware updates periodically using Yubico Authenticator.

**Test backup keys**: Periodically test your backup keys to ensure they work.

**Store backups securely**: Keep backup keys in a secure location separate from your primary key.

**Use with TOTP**: For maximum security, enable TOTP two-factor authentication in addition to Security Key.

---

## Comparison: Security Key vs YubiKey 5

| Feature | Security Key | YubiKey 5 |
|---------|--------------|-----------|
| FIDO2/WebAuthn | ✅ Yes | ✅ Yes |
| U2F | ✅ Yes | ✅ Yes |
| NFC (on NFC models) | ✅ Yes | ✅ Yes |
| PIV (Smart Card) | ❌ No | ✅ Yes |
| OATH (TOTP/HOTP) | ❌ No | ✅ Yes |
| OpenPGP | ❌ No | ✅ Yes |
| Static Password | ❌ No | ✅ Yes |
| Challenge-Response | ❌ No | ✅ Yes |
| Price | Lower | Higher |
| Size | Smaller | Standard |

**For Bifrostvault**: Both Security Key and YubiKey 5 work equally well, as Bifrostvault only uses FIDO2/WebAuthn. Choose Security Key for affordability and compact size, or YubiKey 5 for additional protocols.

---

## Frequently Asked Questions

### Can I use Security Key with other services?

Yes! Security Key works with any service that supports FIDO2/WebAuthn or U2F, including Google, Microsoft, GitHub, Facebook, Dropbox, and hundreds of others.

### Do I need to set a PIN?

No, PIN is optional for basic FIDO2 usage. However, we recommend setting a PIN for enhanced security and to enable discoverable credentials.

### How many credentials can Security Key store?

Security Key can store up to 100 discoverable credentials (resident keys).

### Can I use Security Key on mobile?

Yes! NFC models (Security Key C NFC, Security Key NFC) work with NFC-enabled Android devices and iPhones with iOS 16+. Non-NFC models can be used with USB-C or Lightning adapters.

### What's the difference between Security Key C NFC and Security Key NFC?

The main difference is the connector: Security Key C NFC has USB-C, while Security Key NFC has USB-A. Both have NFC capability.

### Is Security Key waterproof?

Yes, Security Key has an IP68 rating, meaning it's dust-tight and can withstand water immersion up to 1.5 meters for 30 minutes.

### Can I use Security Key for Windows Hello?

Yes, Security Key can be used as a Windows Hello security key for passwordless Windows login.

---

## Additional Resources

- **Yubico Security Key Product Page**: [yubico.com/security-key](https://www.yubico.com/products/security-key/)
- **Security Key Technical Manual**: [docs.yubico.com/hardware/security-key/](https://docs.yubico.com/hardware/security-key/)
- **WebAuthn Guide**: [webauthn.guide](https://webauthn.guide/)
- **FIDO Alliance**: [fidoalliance.org](https://fidoalliance.org/)
- **Bifrostvault Support**: [support@bifrostvault.example.com](mailto:support@bifrostvault.example.com)

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Applies to**: Security Key firmware 5.1.2+
