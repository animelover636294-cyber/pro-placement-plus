import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Shield, Loader2 } from "lucide-react";

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-dark-surface px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md animate-scale-in">{children}</div>
    </div>
  );
}

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
    if (!userData.user) { toast.error("Session not established."); return; }
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id).maybeSingle();
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
      if (verifiedFactors.length > 0) { setMfaRequired(true); setMfaFactorId(verifiedFactors[0].id); return; }
      toast.success("Signed in successfully");
      await navigateByRole();
    } catch (err: any) {
      toast.error(err?.message || "Unable to sign in.");
    } finally { setIsLoading(false); }
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId) return;
    setVerifyingMfa(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) { toast.error(challengeError.message); return; }
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challengeData.id, code: mfaCode });
      if (verifyError) { toast.error("Invalid code."); return; }
      toast.success("Signed in successfully");
      await navigateByRole();
    } catch (err: any) { toast.error(err?.message || "Verification failed."); }
    finally { setVerifyingMfa(false); }
  };

  if (mfaRequired) {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-white/5 bg-dark-elevated p-8 shadow-3d">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-3d-primary">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Two-Factor Auth</h2>
            <p className="mt-1 text-sm text-white/50">Enter the 6-digit code from your authenticator</p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-code" className="text-white/70">Authentication Code</Label>
              <Input id="mfa-code" type="text" inputMode="numeric" placeholder="000000"
                className="border-white/10 bg-white/5 text-center font-mono text-lg tracking-[0.5em] text-white placeholder:text-white/20 focus:border-primary"
                value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && mfaCode.length === 6) handleMfaVerify(); }}
              />
            </div>
            <Button onClick={handleMfaVerify} className="w-full bg-gradient-primary border-0 font-bold shadow-3d-primary" disabled={mfaCode.length !== 6 || verifyingMfa}>
              {verifyingMfa ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify & Sign In"}
            </Button>
            <Button variant="ghost" className="w-full text-white/40 hover:text-white" onClick={() => { setMfaRequired(false); setMfaCode(""); supabase.auth.signOut(); }}>
              Back to Login
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="rounded-2xl border border-white/5 bg-dark-elevated p-8 shadow-3d">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-3d-primary">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-white/50">Sign in to your placement platform</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">Email</Label>
            <Input id="email" type="email" placeholder="you@college.edu"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-primary"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
            </div>
            <Input id="password" type="password"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-primary"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary border-0 font-bold shadow-3d-primary hover:opacity-90 transition-all" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-white/40">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
