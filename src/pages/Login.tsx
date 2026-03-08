import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Shield, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [verifyingMfa, setVerifyingMfa] = useState(false);

  const navigateByRole = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Session not established. Please sign in again.");
      return;
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    navigate(roleData?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) { toast.error(error.message); return; }
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp?.filter((f) => f.status === "verified") ?? [];
      if (verifiedFactors.length > 0) {
        setMfaRequired(true);
        setMfaFactorId(verifiedFactors[0].id);
        return;
      }
      toast.success("Signed in successfully");
      await navigateByRole();
    } catch (err: any) {
      toast.error(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId) return;
    setVerifyingMfa(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) { toast.error(challengeError.message); return; }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });
      if (verifyError) { toast.error("Invalid code. Please try again."); return; }
      toast.success("Signed in successfully");
      await navigateByRole();
    } catch (err: any) {
      toast.error(err?.message || "Verification failed. Please try again.");
    } finally {
      setVerifyingMfa(false);
    }
  };

  const AuthShell = ({ children }: { children: React.ReactNode }) => (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-hero-bg px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 h-[300px] w-[300px] rounded-full bg-accent/10 blur-3xl animate-float-delayed" />
      </div>
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {children}
      </div>
    </div>
  );

  if (mfaRequired) {
    return (
      <AuthShell>
        <div className="glass rounded-2xl p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-primary/25">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Two-Factor Auth</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter the 6-digit code from your authenticator</p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-code">Authentication Code</Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                className="glass text-center text-lg tracking-[0.5em] font-mono"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && mfaCode.length === 6) handleMfaVerify(); }}
              />
            </div>
            <Button onClick={handleMfaVerify} className="w-full gradient-bg border-0 font-semibold shadow-lg shadow-primary/25" disabled={mfaCode.length !== 6 || verifyingMfa}>
              {verifyingMfa ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify & Sign In"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { setMfaRequired(false); setMfaCode(""); supabase.auth.signOut(); }}>
              Back to Login
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="glass rounded-2xl p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-primary/25">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your placement platform</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@college.edu" className="glass" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
            </div>
            <Input id="password" type="password" className="glass" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full gradient-bg border-0 font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-300" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
