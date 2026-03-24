import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronRight, Mail, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadEmailSession, registerWithEmail, signInWithEmail } from "@/lib/emailAuth";
import {
  connectAndSignIn,
  getEthereumProvider,
  loadWalletSession,
  shortenAddress,
} from "@/lib/walletAuth";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const walletSession = loadWalletSession();
    const emailSession = loadEmailSession();
    if (walletSession || emailSession) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const hasMetaMask = useMemo(() => Boolean(getEthereumProvider()), []);

  const handleConnect = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const session = await connectAndSignIn();
      setWallet(session.address);
      setChainId(session.chainId);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wallet sign-in failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    setError(null);
    setSuccessMessage(null);

    if (!signInEmail.trim() || !signInPassword.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const session = signInWithEmail(signInEmail, signInPassword);
      setSuccessMessage(`Signed in as ${session.email}`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email sign-in failed.";
      setError(message);
    }
  };

  const handleEmailSignUp = () => {
    setError(null);
    setSuccessMessage(null);

    if (!signUpEmail.trim() || !signUpPassword.trim() || !confirmPassword.trim()) {
      setError("Please complete all sign-up fields.");
      return;
    }

    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      const session = registerWithEmail(signUpEmail, signUpPassword);
      setSuccessMessage(`Account created for ${session.email}`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-up failed.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-bg-subtle relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/20 blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl glass-strong rounded-3xl p-8 md:p-10 glow-border">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">Secure Access</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2 gradient-text">Sign In to HypeX AI</h1>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Use email and password or connect your wallet to unlock dashboards, alerts, and real-time meme coin intelligence.
            </p>
          </div>

          <Tabs defaultValue="signin" className="mb-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <div className="glass rounded-2xl p-5 border border-primary/20 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInPassword}
                    onChange={(event) => setSignInPassword(event.target.value)}
                  />
                </div>
                <Button variant="hero" size="lg" className="w-full" onClick={handleEmailSignIn}>
                  <Mail className="w-4 h-4" />
                  Sign in with Email
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <div className="glass rounded-2xl p-5 border border-primary/20 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={signUpPassword}
                    onChange={(event) => setSignUpPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
                <Button variant="hero" size="lg" className="w-full" onClick={handleEmailSignUp}>
                  <Mail className="w-4 h-4" />
                  Create account
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="glass rounded-2xl p-5 mb-6 border border-primary/20">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Wallet Authentication (Optional)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect MetaMask to sign in using wallet signature. No private keys are ever requested.
                </p>
              </div>
            </div>
          </div>

          {wallet && (
            <div className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-xs text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Connected {shortenAddress(wallet)} {chainId ? `(Chain ${chainId})` : ""}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-xs text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="hero"
              size="lg"
              className="flex-1"
              onClick={handleConnect}
              disabled={!hasMetaMask || loading}
            >
              {loading ? "Awaiting wallet approval..." : "Login with MetaMask"}
              {!loading && <ChevronRight className="w-4 h-4" />}
            </Button>

            {!hasMetaMask && (
              <Button
                variant="hero-outline"
                size="lg"
                className="flex-1"
                onClick={() => window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer")}
              >
                Install MetaMask
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Need public access first? <Link to="/" className="text-primary hover:underline">Back to landing page</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
