import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { startRegistration } from "@simplewebauthn/browser";
import { ArrowLeft, CheckCircle, KeyRound, Shield, Fingerprint, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { YubiKeyBadge, KeyTypeDescription } from "@/components/YubiKeyBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SetupYubiKey() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [credentialName, setCredentialName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: credentials, refetch } = trpc.webauthn.listCredentials.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const generateOptions = trpc.webauthn.generateRegistrationOptions.useMutation();
  const verifyRegistration = trpc.webauthn.verifyRegistration.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  const handleRegisterYubiKey = async () => {
    if (!credentialName.trim()) {
      toast.error("Please enter a name for your YubiKey");
      return;
    }

    setIsRegistering(true);
    try {
      // Get registration options from server
      const options = await generateOptions.mutateAsync();

      // Start WebAuthn registration
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // Verify registration with server
      await verifyRegistration.mutateAsync({
        response: registrationResponse,
        name: credentialName,
      });

      toast.success("YubiKey registered successfully!");
      setCredentialName("");
      refetch();
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message?.includes("ceremony was not successfully completed")) {
        toast.error("Registration cancelled. Please try again.");
      } else {
        toast.error("Failed to register YubiKey. Please try again.");
      }
    } finally {
      setIsRegistering(false);
    }
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
          <h2 className="text-3xl font-bold mb-2">YubiKey Setup</h2>
          <p className="text-muted-foreground">
            Configure your YubiKey for secure hardware authentication
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-primary mt-1" />
              <div>
                <CardTitle>Hardware Authentication</CardTitle>
                <CardDescription className="mt-2">
                  YubiKey provides phishing-resistant authentication using WebAuthn/FIDO2. 
                  Your private key never leaves the device, making it virtually impossible to steal.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* YubiKey Bio Info */}
        {credentials && credentials.some(c => c.keyType === 'bio') && (
          <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
            <Fingerprint className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">YubiKey Bio Detected</AlertTitle>
            <AlertDescription>
              Your YubiKey Bio supports fingerprint authentication. Make sure you've enrolled your fingerprint 
              using the Yubico Authenticator app and set a FIDO2 PIN (4-63 characters) before use.
              <br /><br />
              <strong>Note:</strong> YubiKey Bio (firmware 5.5.6) supports up to 25 discoverable credentials. 
              You currently have {credentials.length} credential(s) registered.
            </AlertDescription>
          </Alert>
        )}

        {/* Credential Limit Warning */}
        {credentials && credentials.length >= 20 && credentials.some(c => c.keyType === 'bio') && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Approaching Credential Limit</AlertTitle>
            <AlertDescription>
              Your YubiKey Bio is approaching its 25 credential limit ({credentials.length}/25 used). 
              Consider removing unused credentials to free up space.
            </AlertDescription>
          </Alert>
        )}

        {/* Register New YubiKey */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Register New YubiKey</CardTitle>
            <CardDescription>
              Insert your YubiKey and give it a memorable name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credential-name">YubiKey Name</Label>
              <Input
                id="credential-name"
                placeholder="e.g., My YubiKey 5"
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
                disabled={isRegistering}
              />
            </div>
            <Button 
              onClick={handleRegisterYubiKey} 
              disabled={isRegistering || !credentialName.trim()}
              className="w-full"
            >
              {isRegistering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Touch your YubiKey...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Register YubiKey
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Registered YubiKeys */}
        <Card>
          <CardHeader>
            <CardTitle>Registered YubiKeys</CardTitle>
            <CardDescription>
              {credentials?.length || 0} YubiKey(s) registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {credentials && credentials.length > 0 ? (
              <div className="space-y-3">
                {credentials.map((credential) => {
                  const isBio = credential.keyType === 'bio';
                  const maxCreds = isBio ? 25 : 100;
                  const nearLimit = credentials.length >= maxCreds * 0.8;

                  return (
                    <div
                      key={credential.id}
                      className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {isBio ? (
                              <Fingerprint className="h-5 w-5 text-primary" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{credential.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Added {new Date(credential.createdAt).toLocaleDateString()}
                              {credential.lastUsed && ` • Last used ${new Date(credential.lastUsed).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <YubiKeyBadge 
                        keyType={credential.keyType} 
                        userVerified={credential.userVerified}
                      />
                      {isBio && credential.lastVerified && (
                        <p className="text-xs text-muted-foreground">
                          Last biometric verification: {new Date(credential.lastVerified).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <KeyRound className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No YubiKeys registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
