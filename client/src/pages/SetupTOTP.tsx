import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle, Copy, KeyRound, Shield, Smartphone } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SetupTOTP() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: totpStatus, refetch: refetchStatus } = trpc.totp.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const setupMutation = trpc.totp.setup.useMutation();
  const enableMutation = trpc.totp.enable.useMutation();
  const disableMutation = trpc.totp.disable.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  const handleSetup = async () => {
    try {
      const result = await setupMutation.mutateAsync();
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setStep('verify');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate TOTP secret');
    }
  };

  const handleVerify = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      await enableMutation.mutateAsync({ token: verificationToken });
      toast.success('TOTP enabled successfully!');
      setStep('complete');
      refetchStatus();
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    try {
      await disableMutation.mutateAsync();
      toast.success('TOTP disabled');
      refetchStatus();
      setStep('setup');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable TOTP');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/vault")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <KeyRound className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Two-Factor Authentication (TOTP)</h2>
          <p className="text-muted-foreground">
            Add an extra layer of security with Google Authenticator or similar apps
          </p>
        </div>

        {/* Status Card */}
        {totpStatus?.enabled && step === 'setup' && (
          <Card className="mb-6 border-green-500/50 bg-green-500/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <CardTitle className="text-green-500">TOTP Enabled</CardTitle>
                    <CardDescription>
                      Two-factor authentication is active • {totpStatus.backupCodesCount} backup codes remaining
                    </CardDescription>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleDisable}>
                  Disable
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Setup Step */}
        {step === 'setup' && !totpStatus?.enabled && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Authenticator App</CardTitle>
              <CardDescription>
                Use Google Authenticator, Authy, or any TOTP-compatible app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Step 1: Install an Authenticator App</h3>
                  <p className="text-sm text-muted-foreground">
                    Download Google Authenticator, Authy, or Microsoft Authenticator from your app store
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Step 2: Generate QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click the button below to generate your unique QR code
                  </p>
                  <Button onClick={handleSetup} disabled={setupMutation.isPending}>
                    {setupMutation.isPending ? 'Generating...' : 'Generate QR Code'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Open your authenticator app and scan this QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <img src={qrCode} alt="TOTP QR Code" className="w-64 h-64" />
                </div>
                
                <div className="space-y-2">
                  <Label>Or enter this code manually:</Label>
                  <div className="flex gap-2">
                    <Input value={secret} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(secret)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Verify Setup</CardTitle>
                <CardDescription>
                  Enter the 6-digit code from your authenticator app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="000000"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                <Button onClick={handleVerify} disabled={isVerifying} className="w-full">
                  {isVerifying ? 'Verifying...' : 'Verify and Enable'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle className="text-green-500">Setup Complete!</CardTitle>
                  <CardDescription>
                    Two-factor authentication is now enabled
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  Save Your Backup Codes
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Store these codes in a safe place. You can use them to access your account if you lose your device.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border border-border">
                      <code className="flex-1 font-mono text-sm">{code}</code>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Codes
                </Button>
              </div>

              <Button onClick={() => setLocation('/vault')} className="w-full">
                Return to Vault
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
