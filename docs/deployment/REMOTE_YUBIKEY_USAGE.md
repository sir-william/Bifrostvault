# Using YubiKey with Remote Hosted Bifrostvault

This guide explains how to use your YubiKey with Bifrostvault hosted on a remote server (DigitalOcean, AWS, Azure, etc.) and how it differs from local development.

---

## 🎯 TL;DR - Yes, It Works!

**Short Answer**: Yes, you can use your YubiKey with Bifrostvault hosted on a remote server **exactly like locally**, as long as you have:

1. ✅ **HTTPS with valid SSL certificate** (required for WebAuthn)
2. ✅ **Domain name** (e.g., `vault.yourdomain.com`)
3. ✅ **Your YubiKey physically connected to your local computer**
4. ✅ **Modern browser** (Chrome, Firefox, Edge, Safari)

**The YubiKey stays with you** - it never needs to be on the server. WebAuthn works over the internet seamlessly.

---

## 🔐 How It Works

### WebAuthn Architecture

```
┌─────────────────┐         HTTPS          ┌──────────────────┐
│  Your Computer  │◄──────────────────────►│  Remote Server   │
│                 │                         │  (DigitalOcean)  │
│  ┌───────────┐  │                         │                  │
│  │  Browser  │  │   Challenge/Response    │  ┌────────────┐  │
│  └─────┬─────┘  │◄──────────────────────►│  │ Bifrostvault│ │
│        │        │                         │  └────────────┘  │
│        │ USB    │                         │                  │
│  ┌─────▼─────┐  │                         │  ┌────────────┐  │
│  │  YubiKey  │  │                         │  │   MySQL    │  │
│  └───────────┘  │                         │  └────────────┘  │
└─────────────────┘                         └──────────────────┘
```

**Key Points**:

1. **YubiKey stays local**: Your YubiKey is physically connected to your computer via USB
2. **Browser communicates**: Your browser talks to both the YubiKey (USB) and the server (HTTPS)
3. **Server never sees private keys**: Only public keys and signed challenges are sent to the server
4. **Works over internet**: No VPN or special network configuration needed
5. **Secure by design**: WebAuthn is designed for remote authentication

### Authentication Flow

1. **You visit**: `https://vault.yourdomain.com`
2. **Server sends challenge**: Random cryptographic challenge
3. **Browser prompts**: "Use your security key to sign in"
4. **You touch YubiKey**: Fingerprint or touch sensor
5. **YubiKey signs challenge**: Using private key stored on the key
6. **Browser sends signature**: Signed challenge sent to server over HTTPS
7. **Server verifies**: Using stored public key
8. **You're logged in**: Instant, secure authentication

**Important**: The private key **never leaves** your YubiKey. Only signatures are transmitted.

---

## ✅ Requirements for Remote Usage

### 1. HTTPS with Valid SSL Certificate (REQUIRED)

**Why**: WebAuthn is disabled on non-secure contexts (except `localhost`).

**Options**:

#### Option A: Let's Encrypt (Free, Recommended)
```bash
# Included in deploy-ubuntu.sh script
sudo certbot --nginx -d vault.yourdomain.com
```

#### Option B: DigitalOcean Managed Certificate (Free)
- Use DigitalOcean Load Balancer
- Enable automatic SSL certificate
- Point to your droplet

#### Option C: Cloudflare (Free)
- Add your domain to Cloudflare
- Enable "Full (strict)" SSL mode
- Cloudflare provides SSL automatically

**Verification**:
```bash
# Test SSL certificate
curl -I https://vault.yourdomain.com

# Should show:
# HTTP/2 200
# server: nginx
```

### 2. Domain Name (REQUIRED)

**Why**: WebAuthn requires a valid domain (IP addresses don't work reliably).

**Options**:

#### Option A: Your Own Domain
```bash
# Point A record to your droplet IP
vault.yourdomain.com → 203.0.113.45
```

#### Option B: Free Subdomain Services
- **FreeDNS**: https://freedns.afraid.org/
- **DuckDNS**: https://www.duckdns.org/
- **No-IP**: https://www.noip.com/

#### Option C: DigitalOcean Domain
```bash
# If you bought domain through DigitalOcean
# DNS is automatically configured
```

**Configuration**:
```bash
# In .env on server
WEBAUTHN_RP_ID=vault.yourdomain.com
WEBAUTHN_ORIGIN=https://vault.yourdomain.com
```

### 3. Modern Browser (REQUIRED)

**Supported Browsers**:
- ✅ Chrome 90+ (Desktop & Android)
- ✅ Firefox 90+ (Desktop & Android)
- ✅ Edge 90+ (Desktop)
- ✅ Safari 14+ (macOS & iOS 16+)

**Check Support**:
```javascript
// Open browser console on your site
if (window.PublicKeyCredential) {
  console.log('✅ WebAuthn supported');
} else {
  console.log('❌ WebAuthn not supported');
}
```

---

## 🚀 Deployment Guide for DigitalOcean

### Step 1: Create Droplet

```bash
# Recommended specs:
- Distribution: Ubuntu 22.04 LTS
- Plan: Basic ($6/month or higher)
- CPU: 1 vCPU
- RAM: 1 GB (minimum), 2 GB (recommended)
- Storage: 25 GB SSD
- Datacenter: Choose closest to your users
```

### Step 2: Configure Domain

```bash
# In DigitalOcean Dashboard:
1. Go to "Networking" → "Domains"
2. Add your domain
3. Create A record:
   - Hostname: vault (or @)
   - Will Direct To: Your droplet
   - TTL: 3600
```

Wait 5-10 minutes for DNS propagation.

**Verify DNS**:
```bash
# Check DNS resolution
nslookup vault.yourdomain.com

# Should show your droplet IP
```

### Step 3: SSH into Droplet

```bash
# SSH as root
ssh root@your-droplet-ip

# Or if you set up SSH key
ssh -i ~/.ssh/id_rsa root@your-droplet-ip
```

### Step 4: Run Deployment Script

```bash
# Download deployment script
wget https://raw.githubusercontent.com/sir-william/Bifrostvault/main/deploy-ubuntu.sh

# Make executable
chmod +x deploy-ubuntu.sh

# Run deployment
sudo ./deploy-ubuntu.sh
```

**Script will prompt for**:
- MySQL root password
- Database name (default: bifrostvault)
- Database user (default: bifrost)
- Database password
- Domain name (e.g., vault.yourdomain.com)
- OAuth Client ID
- OAuth Client Secret
- Email for SSL notifications

### Step 5: Verify Deployment

```bash
# Check service status
sudo systemctl status bifrostvault

# Check Nginx status
sudo systemctl status nginx

# View logs
sudo journalctl -u bifrostvault -f
```

**Test in browser**:
```
https://vault.yourdomain.com
```

Should see Bifrostvault login page with valid SSL certificate (🔒 in address bar).

---

## 🔑 Using YubiKey with Remote Server

### First Time Setup

1. **Visit your site**:
   ```
   https://vault.yourdomain.com
   ```

2. **Complete OAuth login** (if configured)

3. **Navigate to YubiKey Setup**:
   ```
   https://vault.yourdomain.com/setup-yubikey
   ```

4. **Insert your YubiKey** into your local computer's USB port

5. **Click "Register YubiKey"**
   - Browser will prompt: "Use your security key"
   - Touch your YubiKey (fingerprint or gold contact)
   - Registration complete!

6. **Verify registration**:
   - You should see your key in the list
   - Key type badge (Bio, YubiKey 5, or Security Key)
   - Registration timestamp

### Daily Usage

1. **Visit your site** from any computer:
   ```
   https://vault.yourdomain.com
   ```

2. **Insert your YubiKey** into the computer you're using

3. **Click "Sign In"**

4. **Touch your YubiKey** when prompted

5. **Access your vault** - instant, secure login!

### Using from Different Locations

**Scenario**: You registered your YubiKey at home, now you're at work.

✅ **Works perfectly!** Your YubiKey works from anywhere:
- Home computer
- Work computer
- Friend's computer
- Library computer
- Anywhere with internet access

**Requirements**:
- ✅ Your YubiKey (carry it with you)
- ✅ Computer with USB port
- ✅ Modern browser
- ✅ Internet connection

**What's stored where**:
- **On YubiKey**: Private key (never leaves the key)
- **On server**: Public key, encrypted vault
- **On computer**: Nothing! (unless you save session)

---

## 📱 Mobile Usage

### Android

**Requirements**:
- Android 9+ with NFC
- Chrome or Firefox browser
- YubiKey with NFC (YubiKey 5 NFC, Security Key C NFC, etc.)

**Usage**:
1. Open `https://vault.yourdomain.com` in Chrome
2. Click "Sign In"
3. Tap your YubiKey to the back of your phone
4. Hold steady for 1-2 seconds
5. Authenticated!

**Note**: YubiKey Bio does NOT have NFC. Use USB-C adapter or YubiKey 5C NFC.

### iOS

**Requirements**:
- iOS 16+ with NFC
- Safari browser
- YubiKey with NFC

**Usage**:
1. Open `https://vault.yourdomain.com` in Safari
2. Tap "Sign In"
3. Tap your YubiKey to the back of your iPhone
4. Hold steady for 1-2 seconds
5. Authenticated!

**Lightning Adapter** (Alternative):
- Use YubiKey 5Ci (Lightning + USB-C)
- Or USB-C to Lightning adapter with YubiKey 5C

---

## 🔒 Security Considerations

### Advantages of Remote Hosting

**✅ Always Available**: Access your passwords from anywhere with internet
**✅ Automatic Backups**: Server-side database backups
**✅ No Local Storage**: Encrypted vault stored securely on server
**✅ Multi-Device**: Use from any device with your YubiKey
**✅ Phishing Resistant**: WebAuthn prevents phishing attacks

### Security Best Practices

1. **Use Strong SSL/TLS**:
   ```bash
   # Check SSL rating
   https://www.ssllabs.com/ssltest/analyze.html?d=vault.yourdomain.com
   
   # Should get A or A+ rating
   ```

2. **Enable Firewall**:
   ```bash
   # UFW (included in deploy script)
   sudo ufw status
   
   # Should show:
   # 22/tcp (SSH)
   # 80/tcp (HTTP)
   # 443/tcp (HTTPS)
   ```

3. **Keep System Updated**:
   ```bash
   # Update regularly
   sudo apt update && sudo apt upgrade -y
   
   # Update Bifrostvault
   cd /opt/bifrostvault
   git pull
   pnpm install
   pnpm build
   sudo systemctl restart bifrostvault
   ```

4. **Monitor Logs**:
   ```bash
   # Watch for suspicious activity
   sudo journalctl -u bifrostvault -f
   
   # Check Nginx access logs
   sudo tail -f /var/log/nginx/access.log
   ```

5. **Use Multiple YubiKeys**:
   ```
   Register at least 2 YubiKeys:
   - Primary: Carry with you daily
   - Backup: Store securely at home
   ```

6. **Enable TOTP Backup**:
   ```
   In addition to YubiKey, enable TOTP 2FA
   Provides backup authentication method
   ```

---

## 🆚 Remote vs Local Comparison

| Feature | Local Development | Remote Hosting |
|---------|------------------|----------------|
| **Access** | Only from dev machine | From anywhere |
| **SSL Required** | No (localhost exempt) | Yes (required) |
| **Domain Required** | No (localhost works) | Yes (required) |
| **YubiKey Location** | Local USB | Local USB (same!) |
| **Internet Required** | No | Yes |
| **Multi-Device** | No | Yes |
| **Production Ready** | No | Yes |
| **Automatic Backups** | No | Yes (if configured) |
| **Performance** | Fastest | Network latency |
| **Cost** | Free | $6-12/month |

**Key Insight**: YubiKey usage is **identical** - it's always connected to your local computer via USB, whether the server is local or remote.

---

## 🐛 Troubleshooting Remote Usage

### Issue: "Not a secure context" Error

**Symptoms**: WebAuthn doesn't work, console shows security error

**Solutions**:

1. **Verify HTTPS**:
   ```bash
   # Must be https://, not http://
   https://vault.yourdomain.com  # ✅ Correct
   http://vault.yourdomain.com   # ❌ Wrong
   ```

2. **Check SSL Certificate**:
   ```bash
   # Certificate must be valid
   curl -I https://vault.yourdomain.com
   
   # Should NOT show certificate errors
   ```

3. **Check Browser Address Bar**:
   ```
   Should show: 🔒 vault.yourdomain.com
   Not: ⚠️ Not Secure
   ```

### Issue: "RP ID doesn't match origin"

**Symptoms**: Registration fails with origin mismatch error

**Solutions**:

1. **Check Environment Variables**:
   ```bash
   # On server
   cat /opt/bifrostvault/.env
   
   # Should show:
   WEBAUTHN_RP_ID=vault.yourdomain.com
   WEBAUTHN_ORIGIN=https://vault.yourdomain.com
   ```

2. **Restart Application**:
   ```bash
   sudo systemctl restart bifrostvault
   ```

3. **Clear Browser Cache**:
   ```
   Clear cookies and site data for your domain
   Try in incognito/private mode
   ```

### Issue: YubiKey Works Locally but Not Remotely

**Symptoms**: YubiKey works on localhost but fails on remote server

**Possible Causes**:

1. **SSL Certificate Invalid**:
   ```bash
   # Check certificate
   openssl s_client -connect vault.yourdomain.com:443
   
   # Should show valid certificate chain
   ```

2. **Domain Mismatch**:
   ```bash
   # RP ID must match domain exactly
   # If accessing via: https://vault.yourdomain.com
   # RP ID must be: vault.yourdomain.com
   ```

3. **Browser Permissions**:
   ```
   Check browser settings for USB device permissions
   Some corporate networks block WebAuthn
   ```

### Issue: Slow Authentication

**Symptoms**: YubiKey authentication takes 5-10 seconds

**Solutions**:

1. **Check Network Latency**:
   ```bash
   # Ping your server
   ping vault.yourdomain.com
   
   # Should be <100ms for good experience
   ```

2. **Optimize Server Location**:
   ```
   Choose DigitalOcean datacenter closest to you
   Consider CDN for global users
   ```

3. **Check Server Resources**:
   ```bash
   # On server
   htop
   
   # CPU and RAM should not be maxed out
   ```

---

## 💡 Best Practices

### For Personal Use

1. **Single User**:
   ```
   - Use smallest droplet ($6/month)
   - Register 2 YubiKeys (primary + backup)
   - Enable automatic backups in DigitalOcean
   - Use strong database password
   ```

2. **Access from Multiple Devices**:
   ```
   - Carry your YubiKey with you
   - Works on any computer with USB port
   - Use NFC YubiKey for mobile access
   - Keep backup key at home
   ```

### For Team Use

1. **Multiple Users**:
   ```
   - Use larger droplet (2GB+ RAM)
   - Each user registers their own YubiKey
   - Implement role-based access control
   - Monitor usage logs
   ```

2. **High Availability**:
   ```
   - Use DigitalOcean Load Balancer
   - Multiple droplets for redundancy
   - Database replication
   - Automated backups
   ```

### For Development

1. **Separate Environments**:
   ```
   - Production: vault.yourdomain.com
   - Staging: staging.yourdomain.com
   - Development: localhost:3000
   ```

2. **Testing**:
   ```
   - Test locally first (faster iteration)
   - Deploy to staging for integration tests
   - Promote to production when stable
   ```

---

## 📊 Cost Estimation

### DigitalOcean Droplet

| Users | Droplet Size | RAM | Cost/Month |
|-------|-------------|-----|------------|
| 1-5 | Basic | 1 GB | $6 |
| 5-20 | Basic | 2 GB | $12 |
| 20-50 | Basic | 4 GB | $24 |
| 50+ | General Purpose | 8 GB | $48 |

### Additional Costs

- **Domain**: $10-15/year (if you don't have one)
- **Backups**: $1.20/month (20% of droplet cost)
- **Monitoring**: Free (DigitalOcean built-in)
- **SSL Certificate**: Free (Let's Encrypt)

**Total for Personal Use**: ~$6-12/month

---

## 🎯 Quick Start Checklist

- [ ] Create DigitalOcean droplet (Ubuntu 22.04)
- [ ] Point domain to droplet IP
- [ ] SSH into droplet
- [ ] Run deployment script
- [ ] Verify HTTPS works (🔒 in browser)
- [ ] Register your YubiKey
- [ ] Test authentication
- [ ] Register backup YubiKey
- [ ] Enable automatic backups
- [ ] Set up monitoring

---

## 🆘 Getting Help

If you encounter issues with remote YubiKey usage:

1. **Test Locally First**: Verify YubiKey works on localhost
2. **Check SSL Certificate**: Must be valid and trusted
3. **Verify Domain Configuration**: DNS must resolve correctly
4. **Check Browser Console**: Look for detailed error messages
5. **Test on Demo Site**: https://demo.yubico.com/webauthn
6. **GitHub Issues**: https://github.com/sir-william/Bifrostvault/issues

---

## 📚 Additional Resources

- **DigitalOcean Tutorials**: https://www.digitalocean.com/community/tutorials
- **Let's Encrypt Documentation**: https://letsencrypt.org/docs/
- **WebAuthn Guide**: https://webauthn.guide/
- **Yubico Developer Portal**: https://developers.yubico.com/
- **Bifrostvault Docs**: https://github.com/sir-william/Bifrostvault/tree/main/docs

---

## ✅ Summary

**Yes, you can use your YubiKey with Bifrostvault hosted on DigitalOcean (or any remote server) exactly like locally!**

**Key Points**:
- ✅ YubiKey stays physically connected to your local computer
- ✅ Works over the internet via HTTPS
- ✅ No VPN or special configuration needed
- ✅ Requires valid SSL certificate and domain name
- ✅ Access from anywhere with your YubiKey
- ✅ Secure by design (private keys never leave YubiKey)

**The only difference from local development**: You need HTTPS with a valid SSL certificate instead of using `localhost`.

**Everything else is identical** - insert YubiKey, touch sensor, authenticate!

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Tested On**: DigitalOcean, AWS, Azure, Vultr
