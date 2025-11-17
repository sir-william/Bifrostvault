import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE } from "@/const";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { startRegistration } from '@simplewebauthn/browser';

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "yubikey">("email");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const checkResponse = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const checkData = await checkResponse.json();

      if (checkData.exists) {
        setError("This email is already registered. Please sign in instead.");
        setLoading(false);
        return;
      }

      // Move to YubiKey registration step
      setStep("yubikey");
      setLoading(false);
    } catch (err) {
      console.error("Email check failed:", err);
      setError("Failed to check email. Please try again.");
      setLoading(false);
    }
  };

  const handleYubiKeyRegistration = async () => {
    setError("");
    setLoading(true);

    try {
      // Initialize registration
      const initResponse = await fetch("/api/auth/register/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || "Failed to initialize registration");
      }

      const options = await initResponse.json();

      // Start WebAuthn registration
      const attResp = await startRegistration(options);

      // Complete registration
      const completeResponse = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, response: attResp }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || "Failed to complete registration");
      }

      // Registration successful, redirect to vault
      setLocation("/vault");
    } catch (err: any) {
      console.error("Registration failed:", err);
      if (err.name === "NotAllowedError") {
        setError("YubiKey registration was cancelled or timed out. Please try again.");
      } else {
        setError(err.message || "Failed to register YubiKey. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            {step === "email" 
              ? "Enter your email to get started"
              : "Register your YubiKey to secure your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:underline">
                  Sign in
                </a>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Email: {email}</p>
                {name && <p className="text-sm text-muted-foreground">Name: {name}</p>}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click the button below and follow the prompts to register your YubiKey.
                  You may need to touch your YubiKey when prompted.
                </p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              <Button
                onClick={handleYubiKeyRegistration}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering YubiKey...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Register YubiKey
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep("email")}
                disabled={loading}
              >
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
