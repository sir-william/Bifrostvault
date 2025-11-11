# Bifrostvault User Guide

Welcome to Bifrostvault, your secure password manager with YubiKey hardware authentication. This guide will help you get started and make the most of Bifrostvault's security features.

---

## What is Bifrostvault?

Bifrostvault is a password manager that combines military-grade encryption with hardware security keys for unparalleled protection. Unlike traditional password managers that rely solely on master passwords, Bifrostvault uses YubiKey hardware authentication to ensure that only you can access your vault—even if someone learns your password.

### Why Choose Bifrostvault?

**Zero-Knowledge Security**: Your passwords are encrypted in your browser before being sent to our servers. We never see your data in plaintext, which means even if our servers were compromised, your passwords would remain secure.

**Hardware Authentication**: YubiKey provides phishing-resistant authentication that cannot be intercepted or replayed. Physical possession of your YubiKey is required to access your vault.

**Biometric Support**: If you have a YubiKey Bio, you can use fingerprint authentication for a seamless, passwordless experience.

**Open Source**: Our code is publicly available for security audits, ensuring transparency and trust.

---

## Getting Started

### Step 1: Create an Account

1. **Visit Bifrostvault** at [https://bifrostvault.example.com](https://bifrostvault.example.com)
2. **Click "Sign Up"** to create a new account
3. **Complete OAuth authentication** with your preferred provider (Google, GitHub, etc.)
4. **You're in!** Your account is now created

### Step 2: Set Up Your YubiKey

After creating your account, you'll be prompted to set up a YubiKey for hardware authentication.

1. **Navigate to Settings** → **YubiKey Setup**
2. **Insert your YubiKey** into a USB port
3. **Enter a name** for your key (e.g., "My YubiKey Bio")
4. **Click "Register YubiKey"**
5. **Touch your YubiKey** when prompted by your browser
6. **Success!** Your YubiKey is now registered

**Important**: We strongly recommend registering at least two YubiKeys—one for daily use and one as a backup stored in a secure location.

### Step 3: Start Adding Passwords

Once your YubiKey is set up, you can start adding passwords to your vault:

1. **Navigate to your Vault** (the main page after login)
2. **Click "Add Entry"** button
3. **Choose entry type**: Login, Note, Card, or Identity
4. **Fill in the details**:
   - **Name**: A memorable name (e.g., "GitHub Account")
   - **Username**: Your username or email
   - **Password**: Your password (or generate a strong one)
   - **URL**: The website URL (optional)
5. **Click "Save"**

Your entry is encrypted in your browser before being saved to the vault.

---

## Using Your Vault

### Viewing Entries

Your vault displays all saved entries in a list format. Each entry shows:

- **Name**: The title you gave the entry
- **Type**: Login, Note, Card, or Identity
- **Last Modified**: When the entry was last updated
- **Favorite Star**: Mark important entries as favorites

### Searching Entries

Use the search bar at the top of your vault to quickly find entries:

1. **Type keywords** in the search box
2. **Results filter instantly** as you type
3. **Click an entry** to view details

### Copying Passwords

To copy a password without revealing it:

1. **Click on an entry** to view details
2. **Click the copy icon** next to the password field
3. **Password is copied** to your clipboard
4. **Paste** into the login form

The password remains hidden for security.

### Editing Entries

To update an existing entry:

1. **Click on the entry** to view details
2. **Click "Edit"** button
3. **Make your changes**
4. **Click "Save"**

Changes are re-encrypted before being saved.

### Deleting Entries

To remove an entry from your vault:

1. **Click on the entry** to view details
2. **Click "Delete"** button
3. **Confirm deletion** in the dialog
4. **Entry is permanently removed**

**Warning**: Deleted entries cannot be recovered.

---

## YubiKey Authentication

### Logging In with YubiKey

After initial setup, logging in with your YubiKey is simple:

1. **Visit Bifrostvault** and click "Sign In"
2. **Complete OAuth authentication** (if required)
3. **Touch your YubiKey** when prompted
4. **Access your vault** immediately

### YubiKey Bio Fingerprint Authentication

If you have a YubiKey Bio, you can use fingerprint authentication:

1. **Ensure fingerprints are enrolled** (see [YubiKey Bio Guide](../yubikey/BIO_GUIDE.md))
2. **Touch the fingerprint sensor** when prompted
3. **Green LED** indicates successful authentication
4. **Access your vault** instantly

### PIN Fallback

If fingerprint authentication fails three times on YubiKey Bio:

1. **Browser prompts for PIN** automatically
2. **Enter your FIDO2 PIN** (set during YubiKey setup)
3. **Authentication completes** using PIN
4. **Biometric unblocks** after successful PIN entry

---

## Managing YubiKeys

### Viewing Registered Keys

To see all your registered YubiKeys:

1. **Navigate to Settings** → **YubiKey Setup**
2. **View the list** of registered keys
3. **Check details**: Name, type, registration date, last used

### Registering Additional Keys

We recommend registering multiple YubiKeys for backup:

1. **Navigate to Settings** → **YubiKey Setup**
2. **Insert your second YubiKey**
3. **Enter a name** (e.g., "Backup YubiKey")
4. **Click "Register YubiKey"**
5. **Touch the key** when prompted

You can now use either key to access your vault.

### Removing a Key

If you lose a YubiKey or want to remove it:

1. **Navigate to Settings** → **YubiKey Setup**
2. **Find the key** in the list
3. **Click "Remove"** button
4. **Confirm removal**

**Important**: Ensure you have at least one YubiKey registered before removing others.

---

## Two-Factor Authentication (TOTP)

Bifrostvault includes built-in TOTP (Time-based One-Time Password) support for additional security.

### Enabling TOTP

1. **Navigate to Settings** → **Security**
2. **Click "Enable TOTP"**
3. **Scan the QR code** with your authenticator app (Google Authenticator, Authy, etc.)
4. **Enter the 6-digit code** to verify
5. **Save backup codes** in a secure location

### Using TOTP

After enabling TOTP, you'll be prompted for a code during login:

1. **Complete OAuth authentication**
2. **Touch your YubiKey**
3. **Enter TOTP code** from your authenticator app
4. **Access your vault**

### Backup Codes

When enabling TOTP, you receive 10 backup codes. Each code can be used once if you lose access to your authenticator app.

**Store backup codes securely**:
- Print them and store in a safe
- Save them in a secure note (not in Bifrostvault)
- Keep them separate from your YubiKeys

---

## Security Best Practices

### Password Management

**Use unique passwords**: Never reuse passwords across different sites. Bifrostvault makes this easy by storing all your unique passwords securely.

**Generate strong passwords**: Use Bifrostvault's password generator to create complex, random passwords that are impossible to guess.

**Update regularly**: Change passwords for important accounts periodically, especially if a service reports a data breach.

### YubiKey Security

**Keep your YubiKey secure**: Treat it like a physical key. Don't leave it unattended or lend it to others.

**Register backup keys**: Always have at least two YubiKeys registered—one for daily use and one stored securely at home.

**Report lost keys immediately**: If you lose a YubiKey, log in with your backup key and remove the lost key from your account.

### Account Security

**Enable TOTP**: Add an extra layer of security with two-factor authentication.

**Use a strong master password**: While YubiKey is your primary authentication, your master password is still important.

**Keep software updated**: Ensure your browser and operating system are up to date for the latest security patches.

**Be cautious of phishing**: Always verify you're on the official Bifrostvault website before entering credentials.

---

## Troubleshooting

### Can't Access Vault

If you can't access your vault:

1. **Check YubiKey connection**: Ensure your YubiKey is properly inserted
2. **Try a different USB port**: Some ports may have connectivity issues
3. **Use backup YubiKey**: If your primary key isn't working, use your backup
4. **Check browser compatibility**: Ensure you're using a supported browser (Chrome 90+, Firefox 90+, Edge 90+, Safari 14+)
5. **Clear browser cache**: Sometimes cached data can cause issues

### YubiKey Not Recognized

If your browser doesn't detect your YubiKey:

1. **Remove and reinsert** the key
2. **Try a different USB port**
3. **Restart your browser**
4. **Check browser permissions**: Ensure the site has permission to access security keys
5. **Update YubiKey firmware**: Check for firmware updates using Yubico Authenticator

### Forgot Master Password

If you forget your master password:

**Important**: Due to our zero-knowledge architecture, we cannot reset your master password. If you lose your master password, your vault data cannot be recovered.

**Prevention**:
- Store your master password in a secure location
- Use a memorable but strong passphrase
- Consider using a password hint (but don't make it too obvious)

### Lost YubiKey

If you lose your YubiKey:

1. **Use your backup YubiKey** to log in
2. **Navigate to Settings** → **YubiKey Setup**
3. **Remove the lost key** from your account
4. **Order a replacement** YubiKey
5. **Register the new key** when it arrives

This is why we recommend registering multiple YubiKeys!

---

## Frequently Asked Questions

### Is my data safe?

Yes. Bifrostvault uses zero-knowledge encryption, meaning your data is encrypted in your browser before being sent to our servers. We never see your passwords in plaintext.

### What happens if Bifrostvault servers are hacked?

Even if our servers were compromised, your data would remain secure. All vault entries are encrypted with your master key, which never leaves your device.

### Can I use Bifrostvault on mobile?

Yes, Bifrostvault works on mobile browsers. For YubiKey authentication, you'll need a YubiKey with NFC support (for Android) or a USB-C key with an adapter (for iOS).

### How many passwords can I store?

There's no limit to the number of passwords you can store in your vault.

### Can I import passwords from another password manager?

Password import functionality is coming soon. For now, you'll need to add entries manually.

### What if I don't have a YubiKey?

While we strongly recommend using a YubiKey for maximum security, you can use Bifrostvault with OAuth authentication alone. However, this provides less protection against phishing attacks.

### Can I share passwords with others?

Password sharing functionality is planned for a future release.

---

## Getting Help

If you need assistance:

- **Documentation**: Check our [comprehensive docs](../README.md)
- **FAQ**: Review the [Frequently Asked Questions](./FAQ.md)
- **Troubleshooting**: See the [Troubleshooting Guide](./TROUBLESHOOTING.md)
- **Support Email**: [support@bifrostvault.example.com](mailto:support@bifrostvault.example.com)
- **GitHub Issues**: [Report bugs or request features](https://github.com/sir-william/Bifrostvault/issues)

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0
