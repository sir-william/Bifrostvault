import crypto from 'crypto';

// Email service configuration
const SMTP_ENABLED = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@bifrostvault.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Bifrostvault';

/**
 * Generate a cryptographically secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate token expiry (24 hours from now)
 */
export function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > new Date(expiry);
}

/**
 * Send verification email
 * In development: logs to console
 * In production: sends via SMTP (if configured)
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string | null
): Promise<void> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
  const displayName = name || 'there';

  const emailContent = {
    to: email,
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    subject: 'Verify your Bifrostvault account',
    text: `
Hi ${displayName},

Welcome to Bifrostvault! Please verify your email address to complete your registration.

Click the link below to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

Best regards,
Bifrostvault Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Bifrostvault</h1>
    </div>
    <div class="content">
      <h2>Hi ${displayName},</h2>
      <p>Welcome to Bifrostvault! Please verify your email address to complete your registration.</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
      <p><strong>This link will expire in 24 hours.</strong></p>
      <p>If you didn't create this account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>Bifrostvault Team</p>
      <p>Secured with YubiKey</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  // In development or when SMTP is not configured, log to console
  if (!SMTP_ENABLED || process.env.NODE_ENV === 'development') {
    console.log('[Email] Verification email (development mode):');
    console.log('━'.repeat(80));
    console.log(`To: ${emailContent.to}`);
    console.log(`Subject: ${emailContent.subject}`);
    console.log('');
    console.log(emailContent.text);
    console.log('━'.repeat(80));
    console.log(`\n🔗 Verification URL: ${verificationUrl}\n`);
    return;
  }

  // In production with SMTP configured, send actual email
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail(emailContent);
    console.log(`[Email] Verification email sent to ${email}`);
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error);
    // Fallback to console logging if email fails
    console.log('[Email] Verification URL (fallback):', verificationUrl);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send resend verification email (same as sendVerificationEmail but with different subject)
 */
export async function resendVerificationEmail(
  email: string,
  token: string,
  name?: string | null
): Promise<void> {
  // For now, just use the same function
  // In the future, you might want a different template
  await sendVerificationEmail(email, token, name);
}
