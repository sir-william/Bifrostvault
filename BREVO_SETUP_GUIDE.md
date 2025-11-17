# Brevo Email Service Setup Guide

## Overview
Bifrostvault uses **Brevo** (formerly Sendinblue) to send verification emails. Brevo offers **300 emails per day for free**, which is perfect for a password manager's verification needs.

## Why Brevo?
- ✅ **300 emails/day free** (no credit card required)
- ✅ **Simple API** (no complex SMTP setup)
- ✅ **High deliverability** (professional email infrastructure)
- ✅ **Works from Railway** (just needs API key)
- ✅ **Standalone** (not tied to Gmail or Google)
- ✅ **Easy setup** (5 minutes)

## Step-by-Step Setup

### 1. Create Brevo Account

1. Go to [https://www.brevo.com](https://www.brevo.com)
2. Click **"Sign up free"**
3. Fill in your details:
   - Email address
   - Password
   - Company name (can use "Bifrostvault" or your name)
4. Verify your email address
5. Complete the onboarding questionnaire (select "Transactional emails")

### 2. Get Your API Key

1. Log in to your Brevo account
2. Click on your **profile icon** (top right)
3. Select **"SMTP & API"** from the dropdown
4. Scroll down to **"API Keys"** section
5. Click **"Generate a new API key"**
6. Give it a name: `Bifrostvault Production`
7. Click **"Generate"**
8. **Copy the API key** (you won't be able to see it again!)

**Note:** The API key will be a long string starting with `xkeysib-`. Keep it secure!

### 3. Configure Sender Email

Brevo requires you to verify the sender email address or domain.

#### Option A: Use Your Domain (Recommended)

1. In Brevo dashboard, go to **"Senders & IP"**
2. Click **"Senders"** tab
3. Click **"Add a sender"**
4. Enter your email: `noreply@yourdomain.com`
5. Brevo will send a verification email
6. Click the verification link in the email

#### Option B: Use Brevo's Default Domain (Quick Start)

1. In Brevo dashboard, go to **"Senders & IP"**
2. Click **"Senders"** tab
3. Use the default verified sender provided by Brevo
4. Note the email address (e.g., `your-account@brevo.com`)

### 4. Add Environment Variables to Railway

1. Go to your Railway project
2. Click on **Bifrostvault** service
3. Go to **"Variables"** tab
4. Click **"Raw Editor"**
5. Add these variables:

```env
# Brevo Email Configuration
BREVO_API_KEY=your-brevo-api-key-from-dashboard
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Bifrostvault

# Already set
APP_URL=https://bifrostvault-production-71e0.up.railway.app
NODE_ENV=production
```

6. Click **"Update Variables"**
7. Railway will automatically redeploy

### 5. Test Email Sending

After deployment completes:

1. Register a new account on your Bifrostvault app
2. Check the Railway logs for email confirmation
3. Check your email inbox for the verification email
4. Click the verification link

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `BREVO_API_KEY` | Your Brevo API key (from Brevo dashboard) | `your-api-key-here` |
| `FROM_EMAIL` | Sender email address (must be verified in Brevo) | `noreply@yourdomain.com` |
| `FROM_NAME` | Sender display name | `Bifrostvault` |
| `APP_URL` | Your application URL (for verification links) | `https://bifrostvault-production-71e0.up.railway.app` |
| `NODE_ENV` | Environment mode | `production` |

## Development vs Production

### Development Mode
When `BREVO_API_KEY` is not set or `NODE_ENV=development`:
- Emails are **logged to console**
- Verification URL is displayed in terminal
- No actual emails sent
- Perfect for local testing

### Production Mode
When `BREVO_API_KEY` is set and `NODE_ENV=production`:
- Emails sent via **Brevo API**
- Real email delivery
- Professional email infrastructure

## Troubleshooting

### Email Not Received

**Check 1: Brevo API Key**
- Verify the API key is correct in Railway variables
- Check Railway logs for errors

**Check 2: Sender Email**
- Ensure sender email is verified in Brevo
- Check "Senders & IP" section in Brevo dashboard

**Check 3: Spam Folder**
- Check recipient's spam/junk folder
- Mark as "Not Spam" to improve future delivery

**Check 4: Brevo Account Status**
- Log in to Brevo dashboard
- Check if account is active
- Verify you haven't exceeded daily limit (300 emails/day)

### Railway Logs Show Error

**Error: "Invalid API key"**
```
Solution: Double-check BREVO_API_KEY in Railway variables
```

**Error: "Sender email not verified"**
```
Solution: Verify sender email in Brevo dashboard
```

**Error: "Daily limit exceeded"**
```
Solution: Wait 24 hours or upgrade Brevo plan
```

### Check Brevo Dashboard

1. Log in to Brevo
2. Go to **"Statistics"** → **"Email"**
3. View sent emails, delivery rate, opens, clicks
4. Check for bounces or spam complaints

## Email Limits

### Free Plan
- **300 emails/day**
- Unlimited contacts
- Email support
- Basic statistics

### If You Need More
- **Lite Plan**: $25/month - 10,000 emails/month
- **Premium Plan**: $65/month - 20,000 emails/month
- **Enterprise**: Custom pricing

For a password manager with verification emails, the free plan should be more than sufficient.

## Custom Domain Setup (Optional)

For better email deliverability and branding:

### 1. Add Domain to Brevo

1. In Brevo, go to **"Senders & IP"** → **"Domains"**
2. Click **"Add a domain"**
3. Enter your domain: `yourdomain.com`
4. Brevo will provide DNS records

### 2. Add DNS Records

Add these records to your domain's DNS:

**SPF Record** (TXT):
```
v=spf1 include:spf.brevo.com ~all
```

**DKIM Record** (TXT):
```
(Provided by Brevo - unique to your account)
```

**DMARC Record** (TXT):
```
v=DMARC1; p=none; rua=mailto:postmaster@yourdomain.com
```

### 3. Verify Domain

1. Wait for DNS propagation (up to 48 hours)
2. Click **"Verify"** in Brevo dashboard
3. Once verified, you can send from `anything@yourdomain.com`

## Security Best Practices

1. **Keep API Key Secret**
   - Never commit API key to Git
   - Only store in Railway environment variables
   - Rotate API key if compromised

2. **Monitor Usage**
   - Check Brevo dashboard regularly
   - Set up alerts for unusual activity
   - Monitor bounce rates

3. **Email Content**
   - Keep verification emails simple
   - Include clear call-to-action
   - Add unsubscribe link for marketing emails

## Support

### Brevo Support
- **Documentation**: https://developers.brevo.com/
- **Email Support**: support@brevo.com
- **Help Center**: https://help.brevo.com/

### Bifrostvault Issues
- Check Railway logs for errors
- Verify environment variables are set correctly
- Test in development mode first

## Summary

1. ✅ Create Brevo account (free)
2. ✅ Get API key from Brevo dashboard
3. ✅ Verify sender email
4. ✅ Add `BREVO_API_KEY` to Railway
5. ✅ Add `FROM_EMAIL` to Railway
6. ✅ Deploy and test

That's it! Your Bifrostvault app can now send verification emails without relying on Gmail or any complex SMTP setup.
