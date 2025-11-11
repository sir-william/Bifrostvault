# Local Testing with YubiKey - Complete Guide

This guide provides detailed instructions for testing Bifrostvault with physical YubiKey devices in a local development environment.

---

## 🎯 Best Solution: Native Development (Recommended)

**Why Native Development?**

After evaluating Docker, Vagrant, and native development, **native development is the best solution** for YubiKey testing because:

**USB Passthrough Complexity**: Docker and Vagrant require complex USB passthrough configuration that often fails with security keys due to:
- WebAuthn requires direct USB access to the authenticator
- Virtualization layers add latency that breaks FIDO2 timing requirements
- USB passthrough is unreliable across different host operating systems
- Container security policies often block raw USB device access

**Browser Security Requirements**: WebAuthn has strict security requirements:
- Must run on `localhost` or HTTPS domains
- Browser must have direct access to USB devices
- No proxy or virtualization layer between browser and authenticator
- Secure context validation happens at browser level

**Development Efficiency**: Native development provides:
- Instant hot reload without container rebuilds
- Direct access to all USB devices
- No network latency or virtualization overhead
- Full access to browser DevTools
- Simpler debugging workflow

---

## 📋 Prerequisites

### Required Hardware
- **YubiKey Device**: YubiKey Bio, YubiKey 5, or Security Key
- **USB Port**: USB-A or USB-C depending on your key
- **Computer**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

### Required Software
- **Node.js 22+**: JavaScript runtime
- **pnpm**: Package manager
- **MySQL or TiDB**: Database server
- **Modern Browser**: Chrome 90+, Firefox 90+, Edge 90+, or Safari 14+
- **Git**: Version control

---

## 🚀 Setup Guide

### Step 1: Install Node.js 22

#### macOS
```bash
# Using Homebrew
brew install node@22

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

#### Ubuntu/Debian
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

#### Windows
```powershell
# Using Chocolatey
choco install nodejs-lts

# Or download installer from nodejs.org
# https://nodejs.org/en/download/
```

Verify installation:
```bash
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x
```

### Step 2: Install pnpm

```bash
npm install -g pnpm

# Verify installation
pnpm --version  # Should show 9.x.x
```

### Step 3: Install MySQL

#### macOS
```bash
# Using Homebrew
brew install mysql
brew services start mysql

# Secure installation
mysql_secure_installation
```

#### Ubuntu/Debian
```bash
# Install MySQL 8.0
sudo apt-get update
sudo apt-get install -y mysql-server

# Start service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation
```

#### Windows
```powershell
# Using Chocolatey
choco install mysql

# Or download installer from mysql.com
# https://dev.mysql.com/downloads/installer/
```

#### Using Docker (Alternative)
```bash
# Run MySQL in Docker
docker run -d \
  --name bifrostvault-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=bifrostvault \
  -e MYSQL_USER=bifrost \
  -e MYSQL_PASSWORD=vaultpass \
  -p 3306:3306 \
  mysql:8.0

# Verify it's running
docker ps | grep bifrostvault-mysql
```

### Step 4: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/sir-william/Bifrostvault.git
cd Bifrostvault

# Or if you forked it
git clone https://github.com/YOUR_USERNAME/Bifrostvault.git
cd Bifrostvault
```

### Step 5: Install Dependencies

```bash
pnpm install
```

This will install all frontend and backend dependencies.

### Step 6: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Minimal `.env` configuration for local testing:**

```bash
# Database Configuration
DATABASE_URL=mysql://bifrost:vaultpass@localhost:3306/bifrostvault

# WebAuthn Configuration (IMPORTANT for YubiKey)
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# OAuth Configuration (optional for local testing)
# You can skip OAuth and use mock authentication for development
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Environment
NODE_ENV=development
PORT=3000
```

**Important WebAuthn Settings:**
- `WEBAUTHN_RP_ID` must be `localhost` for local development
- `WEBAUTHN_ORIGIN` must be `http://localhost:3000` (or your dev port)
- Never use `127.0.0.1` - use `localhost` for WebAuthn compatibility

### Step 7: Setup Database

```bash
# Create database
mysql -u root -p
```

In MySQL console:
```sql
CREATE DATABASE bifrostvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bifrost'@'localhost' IDENTIFIED BY 'vaultpass';
GRANT ALL PRIVILEGES ON bifrostvault.* TO 'bifrost'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Initialize schema:
```bash
pnpm db:push
```

### Step 8: Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

**Important**: Always access via `http://localhost:3000`, not `http://127.0.0.1:3000`, for WebAuthn to work properly.

---

## 🔑 Testing with YubiKey

### Step 1: Verify YubiKey Connection

#### macOS
```bash
# Check USB devices
system_profiler SPUSBDataType | grep -i yubico

# Should show something like:
# YubiKey 5 NFC:
# Product ID: 0x0407
# Vendor ID: 0x1050  (Yubico AB)
```

#### Linux
```bash
# Check USB devices
lsusb | grep -i yubico

# Should show something like:
# Bus 001 Device 005: ID 1050:0407 Yubico.com Yubikey 4/5 OTP+U2F+CCID
```

#### Windows
```powershell
# Open Device Manager
devmgmt.msc

# Look for "Smart card readers" or "Security Devices"
# Should show "YubiKey Smart Card" or similar
```

### Step 2: Test YubiKey in Browser

1. **Open Chrome DevTools**
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)
   - Go to **Console** tab

2. **Test WebAuthn API**
   ```javascript
   // Check if WebAuthn is available
   if (window.PublicKeyCredential) {
     console.log('✅ WebAuthn is supported');
   } else {
     console.log('❌ WebAuthn is not supported');
   }
   
   // Check if platform authenticator is available
   PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
     .then(available => {
       console.log('Platform authenticator:', available ? '✅ Available' : '❌ Not available');
     });
   ```

3. **Test YubiKey Detection**
   - Navigate to `http://localhost:3000`
   - Open DevTools Console
   - Insert your YubiKey
   - You should see browser detect the security key

### Step 3: Register YubiKey

1. **Navigate to Setup Page**
   ```
   http://localhost:3000/setup-yubikey
   ```

2. **Enter Key Name**
   - Type a descriptive name (e.g., "YubiKey Bio - Primary")

3. **Click "Register YubiKey"**
   - Browser will show a security key prompt
   - **For YubiKey Bio**: Touch the fingerprint sensor
   - **For YubiKey 5/Security Key**: Touch the gold contact

4. **Verify Registration**
   - You should see a success message
   - The key should appear in the registered keys list
   - Check the key type badge (Bio, YubiKey 5, or Security Key)

### Step 4: Test Authentication

1. **Logout** (if logged in)

2. **Navigate to Login**
   ```
   http://localhost:3000/login
   ```

3. **Authenticate with YubiKey**
   - Browser will prompt for security key
   - Touch your YubiKey
   - You should be logged in immediately

### Step 5: Test Biometric Features (YubiKey Bio Only)

#### Prerequisites
- YubiKey Bio with firmware 5.5.6+
- FIDO2 PIN set on the key
- At least one fingerprint enrolled

#### Test Fingerprint Authentication
1. **Navigate to Setup Page**
   ```
   http://localhost:3000/setup-yubikey
   ```

2. **Register with Fingerprint**
   - Click "Register YubiKey"
   - Touch the fingerprint sensor
   - Verify "Biometric" badge appears

3. **Check Verification Status**
   - Look for "Last biometric verification" timestamp
   - Verify the green "Biometric" badge is displayed

#### Test PIN Fallback
1. **Trigger Failed Fingerprint Attempts**
   - Touch the sensor with a non-enrolled finger 3 times
   - Amber LED should blink 3 times

2. **Enter PIN**
   - Browser will prompt for PIN
   - Enter your FIDO2 PIN
   - Authentication should complete

3. **Verify Biometric Unblocked**
   - Try fingerprint authentication again
   - Should work normally

---

## 🐛 Debugging YubiKey Issues

### Issue: Browser Doesn't Detect YubiKey

**Symptoms**: No prompt appears when clicking "Register YubiKey"

**Solutions**:

1. **Check USB Connection**
   ```bash
   # macOS
   system_profiler SPUSBDataType | grep -i yubico
   
   # Linux
   lsusb | grep -i yubico
   ```

2. **Try Different USB Port**
   - Some USB 3.0 ports have compatibility issues
   - Try USB 2.0 port if available

3. **Check Browser Permissions**
   - Chrome: `chrome://settings/content/usbDevices`
   - Ensure site has permission to access USB devices

4. **Restart Browser**
   - Close all browser windows
   - Reopen and try again

5. **Check HTTPS/Localhost**
   - WebAuthn requires secure context
   - Use `localhost`, not `127.0.0.1`
   - Or use HTTPS with valid certificate

### Issue: "NotAllowedError" or "SecurityError"

**Symptoms**: Error message when trying to register

**Solutions**:

1. **Check Origin Configuration**
   ```bash
   # In .env file
   WEBAUTHN_ORIGIN=http://localhost:3000  # Must match browser URL
   ```

2. **Check RP ID Configuration**
   ```bash
   # In .env file
   WEBAUTHN_RP_ID=localhost  # Must be localhost for local dev
   ```

3. **Clear Browser Data**
   - Clear cookies and site data
   - Try in incognito/private mode

4. **Check Browser Console**
   - Open DevTools Console
   - Look for detailed error messages

### Issue: Fingerprint Not Recognized (YubiKey Bio)

**Symptoms**: Amber LED blinks, fingerprint not accepted

**Solutions**:

1. **Clean the Sensor**
   ```
   Use a soft, lint-free cloth to clean the fingerprint sensor
   ```

2. **Clean Your Finger**
   ```
   Wash and dry your hands thoroughly
   Remove any oil, dirt, or moisture
   ```

3. **Re-enroll Fingerprint**
   ```bash
   # Using Yubico Authenticator
   # 1. Open Yubico Authenticator
   # 2. Go to FIDO2 → Fingerprints
   # 3. Delete problematic fingerprint
   # 4. Re-enroll with multiple scans
   ```

4. **Use Different Finger**
   ```
   If you enrolled multiple fingers, try a different one
   ```

5. **Use PIN Fallback**
   ```
   After 3 failed attempts, enter your FIDO2 PIN
   ```

### Issue: "Timeout" Error

**Symptoms**: Operation times out before completion

**Solutions**:

1. **Touch Faster**
   - Touch the sensor/contact immediately when prompted
   - Don't wait too long

2. **Increase Timeout**
   ```javascript
   // In server/webauthn.ts
   timeout: 120000,  // Increase from 60000 to 120000 (2 minutes)
   ```

3. **Check USB Power**
   - Some USB hubs don't provide enough power
   - Connect directly to computer

### Issue: Multiple Keys Not Working

**Symptoms**: Only one key works, others fail

**Solutions**:

1. **Register Each Key Separately**
   ```
   Remove all keys except the one you're registering
   Complete registration
   Remove that key, insert next one
   Repeat for each key
   ```

2. **Check Credential Limits**
   ```
   YubiKey Bio (5.5.6): 25 credentials max
   YubiKey Bio (5.7+): 100 credentials max
   YubiKey 5: 100 credentials max
   ```

3. **Clear Old Credentials**
   ```bash
   # Using Yubico Authenticator
   # 1. Open Yubico Authenticator
   # 2. Go to FIDO2 → Credentials
   # 3. Delete unused credentials
   ```

---

## 🔍 Advanced Testing

### Testing with Browser DevTools

#### Monitor WebAuthn Calls

1. **Open DevTools** → **Network** tab
2. **Filter by "trpc"**
3. **Watch for**:
   - `webauthn.generateRegistrationOptions`
   - `webauthn.verifyRegistration`
   - `webauthn.generateAuthenticationOptions`
   - `webauthn.verifyAuthentication`

#### Debug WebAuthn Responses

```javascript
// In browser console
// Intercept navigator.credentials.create
const originalCreate = navigator.credentials.create;
navigator.credentials.create = async function(...args) {
  console.log('WebAuthn create called:', args);
  const result = await originalCreate.apply(this, args);
  console.log('WebAuthn create result:', result);
  return result;
};

// Intercept navigator.credentials.get
const originalGet = navigator.credentials.get;
navigator.credentials.get = async function(...args) {
  console.log('WebAuthn get called:', args);
  const result = await originalGet.apply(this, args);
  console.log('WebAuthn get result:', result);
  return result;
};
```

### Testing Different YubiKey Models

#### Test Matrix

| Test Case | YubiKey Bio | YubiKey 5 | Security Key |
|-----------|-------------|-----------|--------------|
| Registration | ✅ | ✅ | ✅ |
| Fingerprint Auth | ✅ | ❌ | ❌ |
| Touch Auth | ✅ | ✅ | ✅ |
| PIN Fallback | ✅ | ✅ | ✅ |
| User Verification | ✅ | ✅ | ✅ |
| Key Type Detection | ✅ | ✅ | ✅ |
| Credential Limit | 25/100 | 100 | 100 |

#### Test Procedure

1. **Register Each Key Type**
   ```
   1. Insert YubiKey Bio → Register → Verify "YubiKey Bio" badge
   2. Insert YubiKey 5 → Register → Verify "YubiKey 5" badge
   3. Insert Security Key → Register → Verify "Security Key" badge
   ```

2. **Test Authentication with Each**
   ```
   1. Logout
   2. Login with YubiKey Bio (fingerprint)
   3. Logout
   4. Login with YubiKey 5 (touch)
   5. Logout
   6. Login with Security Key (touch)
   ```

3. **Verify Key-Specific Features**
   ```
   YubiKey Bio:
   - ✅ Biometric badge displayed
   - ✅ Last verified timestamp shown
   - ✅ Credential limit warning (if >20 credentials)
   
   YubiKey 5:
   - ✅ YubiKey 5 badge displayed
   - ✅ No biometric features shown
   
   Security Key:
   - ✅ Security Key badge displayed
   - ✅ No biometric features shown
   ```

---

## 📊 Testing Checklist

### Basic Functionality
- [ ] YubiKey detected by operating system
- [ ] Browser supports WebAuthn
- [ ] Application loads at `http://localhost:3000`
- [ ] Database connection works
- [ ] YubiKey registration successful
- [ ] YubiKey authentication successful

### YubiKey Bio Specific
- [ ] Fingerprint authentication works
- [ ] PIN fallback works after 3 failed attempts
- [ ] Biometric badge displayed
- [ ] Last verified timestamp shown
- [ ] Credential limit warning appears (if applicable)
- [ ] Bio-specific alerts displayed

### Multi-Key Testing
- [ ] Multiple keys can be registered
- [ ] Each key type detected correctly
- [ ] Authentication works with any registered key
- [ ] Key-specific UI elements display correctly

### Error Handling
- [ ] Cancellation handled gracefully
- [ ] Timeout handled gracefully
- [ ] Invalid PIN shows error message
- [ ] Blocked biometric shows appropriate message

---

## 🚀 Performance Tips

### Optimize Development Experience

1. **Use Hot Reload**
   ```bash
   # Vite provides instant HMR
   pnpm dev
   # Changes reflect immediately without full reload
   ```

2. **Keep YubiKey Inserted**
   ```
   Leave your YubiKey inserted during development
   Faster testing without constant insertion/removal
   ```

3. **Use Browser Profiles**
   ```bash
   # Chrome with separate profile for testing
   chrome --user-data-dir=/tmp/bifrost-test http://localhost:3000
   ```

4. **Mock WebAuthn for Unit Tests**
   ```javascript
   // Use the mock helpers in e2e/helpers/webauthn-mock.ts
   // No physical YubiKey needed for automated tests
   ```

---

## 📚 Additional Resources

- **Yubico Developer Portal**: https://developers.yubico.com/
- **WebAuthn Guide**: https://webauthn.guide/
- **SimpleWebAuthn Docs**: https://simplewebauthn.dev/
- **Bifrostvault Docs**: https://github.com/sir-william/Bifrostvault/tree/main/docs

---

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. **Check Browser Console**: Look for detailed error messages
2. **Check Server Logs**: Run `pnpm dev` and watch for errors
3. **Test YubiKey**: Verify it works on https://demo.yubico.com/webauthn
4. **GitHub Issues**: https://github.com/sir-william/Bifrostvault/issues
5. **Discussions**: https://github.com/sir-william/Bifrostvault/discussions

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Tested On**: macOS 14, Ubuntu 22.04, Windows 11
