# YubiKey Bio Setup Guide for Bifrostvault

This comprehensive guide will help you set up and use your YubiKey Bio with Bifrostvault for secure, passwordless authentication using fingerprint biometrics.

---

## What is YubiKey Bio?

The YubiKey Bio Series is Yubico's line of hardware security keys with integrated fingerprint sensors. These devices provide phishing-resistant authentication using biometric verification, eliminating the need to remember complex passwords while maintaining the highest security standards.

### Key Features

**Fingerprint Authentication**: The YubiKey Bio includes a capacitive fingerprint sensor that allows you to authenticate by simply touching the sensor. Your fingerprint template is stored securely in the key's hardware and never leaves the device.

**PIN Fallback**: After three unsuccessful fingerprint attempts, the key prompts for a PIN (4-63 characters for FIDO Edition). This ensures you can always access your accounts even if the fingerprint sensor has difficulty reading your finger.

**Discoverable Credentials**: The YubiKey Bio can store up to 25 discoverable credentials (firmware 5.5.6) or 100 credentials (firmware 5.7+). These credentials enable true passwordless authentication without requiring a username.

**FIDO2/WebAuthn Certified**: The YubiKey Bio is fully certified for FIDO2 and WebAuthn standards, ensuring compatibility with modern web applications and services.

---

## Supported Models

Bifrostvault supports the following YubiKey Bio models:

| Model | Form Factor | Firmware | Max Credentials | Status |
|-------|-------------|----------|-----------------|--------|
| YubiKey Bio - FIDO Edition (USB-A) | USB-A | 5.5.6+ | 25 (5.5.6), 100 (5.7+) | ✅ Fully Supported |
| YubiKey Bio - FIDO Edition (USB-C) | USB-C | 5.5.6+ | 25 (5.5.6), 100 (5.7+) | ✅ Fully Supported |
| YubiKey Bio - Multi-protocol Edition | USB-A/C | 5.5.6+ | 25 (5.5.6), 100 (5.7+) | ✅ Fully Supported |

---

## Prerequisites

Before setting up your YubiKey Bio with Bifrostvault, ensure you have:

1. **YubiKey Bio Device**: A physical YubiKey Bio key (USB-A or USB-C)
2. **Yubico Authenticator**: Desktop application for fingerprint enrollment
3. **Modern Browser**: Chrome 90+, Firefox 90+, Edge 90+, or Safari 14+
4. **FIDO2 PIN Set**: A PIN configured on your YubiKey Bio (required for fingerprint enrollment)

---

## Step 1: Set Up FIDO2 PIN

Before you can enroll fingerprints, you must set a FIDO2 PIN on your YubiKey Bio.

### Using Yubico Authenticator

1. **Download Yubico Authenticator** from [yubico.com/products/yubico-authenticator](https://www.yubico.com/products/yubico-authenticator/)
2. **Install and launch** the application
3. **Insert your YubiKey Bio** into a USB port
4. **Navigate to Settings** → **FIDO2** → **Set PIN**
5. **Enter a PIN** (4-63 characters for FIDO Edition, 6-8 for Multi-protocol)
6. **Confirm your PIN** by entering it again
7. **Click "Set PIN"** to save

### PIN Requirements

- **FIDO Edition**: 4-63 characters (letters, numbers, symbols)
- **Multi-protocol Edition**: 6-8 characters (if PIV is enabled)
- **Recommendation**: Use a memorable but secure PIN (e.g., 6-8 characters)
- **Important**: After 8 incorrect PIN attempts, the FIDO2 application locks

### PIN Best Practices

Choose a PIN that balances security and usability. A 6-digit numeric PIN is sufficient for most users, as the YubiKey Bio's primary security comes from physical possession and biometric verification. Avoid using easily guessable PINs like "123456" or your birthday.

---

## Step 2: Enroll Fingerprints

After setting your PIN, you can enroll up to 5 fingerprints on your YubiKey Bio.

### Using Yubico Authenticator

1. **Open Yubico Authenticator** with your YubiKey Bio inserted
2. **Navigate to Settings** → **FIDO2** → **Fingerprints**
3. **Click "Add Fingerprint"**
4. **Enter your FIDO2 PIN** when prompted
5. **Follow the on-screen instructions** to scan your fingerprint multiple times
6. **Name your fingerprint** (e.g., "Right Thumb", "Left Index")
7. **Repeat** for additional fingers (recommended: enroll 2-3 fingerprints)

### Using Windows (Windows 10/11)

1. **Open Windows Settings** → **Accounts** → **Sign-in options**
2. **Click "Security Key"** → **Manage**
3. **Insert your YubiKey Bio** when prompted
4. **Enter your FIDO2 PIN**
5. **Follow the enrollment wizard** to scan your fingerprint
6. **Complete the enrollment** process

### Using Chrome Browser

1. **Open Chrome** and navigate to `chrome://settings/securityKeys`
2. **Click "Manage security keys"**
3. **Insert your YubiKey Bio**
4. **Click "Add fingerprint"**
5. **Enter your PIN** and follow the prompts

### Fingerprint Enrollment Tips

For best results when enrolling fingerprints:

- **Clean your finger** and the sensor before starting
- **Use consistent pressure** when touching the sensor
- **Cover the entire sensor** with your fingerprint
- **Vary the angle** slightly during multiple scans
- **Enroll multiple fingers** for backup (e.g., both thumbs)
- **Test immediately** after enrollment to ensure recognition

---

## Step 3: Register YubiKey Bio with Bifrostvault

Now that your YubiKey Bio is configured, register it with Bifrostvault.

### Registration Process

1. **Log in to Bifrostvault** using your OAuth credentials
2. **Navigate to Settings** → **YubiKey Setup** (or click the settings icon in the vault header)
3. **Enter a name** for your YubiKey Bio (e.g., "My YubiKey Bio USB-C")
4. **Click "Register YubiKey"**
5. **Touch the fingerprint sensor** when prompted by your browser
6. **Wait for confirmation** that registration was successful

### What Happens During Registration

When you register your YubiKey Bio, the following process occurs:

1. **Challenge Generation**: Bifrostvault server generates a cryptographic challenge
2. **Browser Prompt**: Your browser displays a WebAuthn prompt
3. **Fingerprint Verification**: You touch the sensor to verify your identity
4. **Key Signing**: The YubiKey Bio signs the challenge with its private key
5. **Credential Storage**: Bifrostvault stores the public key and metadata
6. **Confirmation**: You receive a success message

The entire process takes only a few seconds and requires no password entry.

---

## Step 4: Using YubiKey Bio for Authentication

After registration, you can use your YubiKey Bio for passwordless authentication.

### Login Flow

1. **Navigate to Bifrostvault** login page
2. **Click "Sign In"** (you may be redirected to OAuth first)
3. **Touch the fingerprint sensor** when prompted
4. **Access your vault** immediately upon successful verification

### Biometric Authentication

When authenticating with your YubiKey Bio:

- **Green LED**: Fingerprint recognized, authentication successful
- **Amber LED (3 blinks)**: Fingerprint not recognized, try again
- **Amber LED (continuous)**: Biometric blocked after 3 failures, PIN required

### PIN Fallback

If fingerprint authentication fails three times:

1. **Browser prompts for PIN** automatically
2. **Enter your FIDO2 PIN** (the one you set in Step 1)
3. **Authentication completes** using PIN verification
4. **Biometric unblocks** after successful PIN entry

---

## Managing Credentials

### Viewing Registered Keys

To see all your registered YubiKeys:

1. **Navigate to Settings** → **YubiKey Setup**
2. **View the list** of registered keys
3. **Check details**: Name, registration date, last used, key type

### Credential Limits

Your YubiKey Bio has a limited number of credential slots:

- **Firmware 5.5.6**: 25 discoverable credentials
- **Firmware 5.7+**: 100 discoverable credentials

Bifrostvault displays a warning when you approach the limit (20+ credentials for firmware 5.5.6).

### Removing Credentials

To free up space on your YubiKey Bio:

1. **Use Yubico Authenticator** desktop app
2. **Navigate to FIDO2** → **Credentials**
3. **Select credentials** you no longer use
4. **Click "Delete"** to remove them

Note: Bifrostvault does not currently support credential deletion directly in the UI. Use Yubico Authenticator for credential management.

---

## Troubleshooting

### Fingerprint Not Recognized

If your fingerprint is consistently not recognized:

**Clean the sensor**: Use a soft, lint-free cloth to clean the fingerprint sensor. Oil, dirt, or moisture can interfere with recognition.

**Clean your finger**: Wash and dry your hands thoroughly. Wet, oily, or dirty fingers may not be recognized.

**Try a different finger**: If you enrolled multiple fingerprints, try using a different finger.

**Re-enroll fingerprint**: Delete and re-enroll the problematic fingerprint using Yubico Authenticator.

**Use PIN fallback**: After 3 failed attempts, use your PIN to authenticate.

### Biometric Blocked State

If your YubiKey Bio enters the biometric blocked state (continuous amber LED):

1. **Remove the key** from the USB port
2. **Reinsert the key** to reset the state
3. **Use PIN authentication** instead of fingerprint
4. **Successful PIN entry** will unblock biometric authentication

### PIN Forgotten

If you forget your FIDO2 PIN:

**Warning**: There is no way to recover a forgotten PIN. You must reset the FIDO2 application, which will delete all credentials.

To reset:

1. **Open Yubico Authenticator**
2. **Navigate to FIDO2** → **Reset**
3. **Confirm the reset** (this deletes all FIDO2 credentials)
4. **Set a new PIN**
5. **Re-enroll fingerprints**
6. **Re-register** with all services (including Bifrostvault)

### Registration Fails

If YubiKey Bio registration fails in Bifrostvault:

**Check browser compatibility**: Ensure you're using a modern browser with WebAuthn support (Chrome 90+, Firefox 90+, Edge 90+, Safari 14+).

**Check HTTPS**: WebAuthn requires a secure context. Ensure you're accessing Bifrostvault via HTTPS (or localhost for development).

**Check PIN**: Ensure you've set a FIDO2 PIN on your YubiKey Bio.

**Try different USB port**: Some USB ports may have connectivity issues.

**Update firmware**: Check if a firmware update is available for your YubiKey Bio.

---

## Security Considerations

### Fingerprint Security

**Local Storage**: Your fingerprint template is stored only on the YubiKey Bio hardware, never on the server or in the browser.

**No Transmission**: Fingerprints are never transmitted over the network. Only cryptographic signatures are sent.

**Secure Element**: The YubiKey Bio uses a secure element to protect fingerprint data from extraction.

**False Accept Rate**: The YubiKey Bio has a false accept rate of less than 1 in 50,000, meeting industry standards for biometric security.

### Physical Security

**Keep your YubiKey Bio secure**: Treat it like a physical key. If someone gains possession of your YubiKey Bio and can provide a matching fingerprint (or your PIN), they can access your accounts.

**Register multiple keys**: For backup, register a second YubiKey (Bio or standard) with Bifrostvault. Store it in a secure location.

**Report lost keys**: If you lose your YubiKey Bio, immediately remove it from your Bifrostvault account and all other services.

### Best Practices

1. **Enroll multiple fingerprints** (2-3) for redundancy
2. **Register a backup YubiKey** in case your primary is lost
3. **Keep your PIN secure** and memorable
4. **Store backup codes** for TOTP in a safe place
5. **Regularly test** your YubiKey Bio to ensure it works
6. **Update firmware** when new versions are released

---

## Advanced Features

### User Verification Tracking

Bifrostvault tracks when biometric verification is used:

- **Last Verified**: Timestamp of last successful biometric authentication
- **Biometric Badge**: Visual indicator showing the key supports biometrics
- **Verification Status**: Shows whether fingerprint or PIN was used

### Credential Management

Monitor your credential usage:

- **Credential Count**: See how many credentials are stored on your key
- **Capacity Warning**: Get alerts when approaching the 25-credential limit
- **Usage Statistics**: Track when each credential was last used

### Multi-Key Support

You can register multiple YubiKeys with Bifrostvault:

- **Primary Key**: Your daily-use YubiKey Bio
- **Backup Key**: A second YubiKey stored securely at home
- **Work Key**: A separate key for work-related access
- **Travel Key**: A compact Security Key for travel

Each key is tracked independently with its own metadata.

---

## Frequently Asked Questions

### Can I use YubiKey Bio with other services?

Yes! YubiKey Bio works with any service that supports FIDO2/WebAuthn, including Google, Microsoft, GitHub, Facebook, Dropbox, and hundreds of others.

### How many fingerprints can I enroll?

You can enroll up to 5 fingerprints on your YubiKey Bio.

### Can I use YubiKey Bio on mobile devices?

Yes, YubiKey Bio works with NFC-enabled Android devices and USB-C devices. iOS support requires a USB-C to Lightning adapter or NFC (on supported models).

### What happens if my finger is injured?

If you injure the finger you enrolled, you can:
- Use a different enrolled finger (if you enrolled multiple)
- Use the PIN fallback option
- Re-enroll a different finger temporarily

### Is YubiKey Bio waterproof?

Yes, YubiKey Bio has an IP68 rating, meaning it's dust-tight and can withstand immersion in water up to 1.5 meters for 30 minutes.

### Can I share my YubiKey Bio?

No, YubiKey Bio is designed for single-user use. Sharing your key compromises security, as anyone with an enrolled fingerprint can access your accounts.

---

## Additional Resources

- **Yubico YubiKey Bio Product Page**: [yubico.com/yubikey-bio](https://www.yubico.com/products/yubikey-bio/)
- **YubiKey Bio Technical Manual**: [docs.yubico.com/hardware/yubikey/yk-tech-manual/yk5-bio-specifics.html](https://docs.yubico.com/hardware/yubikey/yk-tech-manual/yk5-bio-specifics.html)
- **Yubico Authenticator Download**: [yubico.com/products/yubico-authenticator](https://www.yubico.com/products/yubico-authenticator/)
- **WebAuthn Guide**: [webauthn.guide](https://webauthn.guide/)
- **Bifrostvault Support**: [support@bifrostvault.example.com](mailto:support@bifrostvault.example.com)

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Applies to**: YubiKey Bio firmware 5.5.6+
