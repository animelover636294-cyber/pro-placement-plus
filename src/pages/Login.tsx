import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Shield, Loader2 } from "lucide-react";
import { AnimatedBackground } from "@/components/3d/AnimatedBackground";
import { GlassCard } from "@/components/3d/GlassCard";
import { motion } from "framer-motion";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77-.01-.54z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Divider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/[0.08]" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-transparent px-3 text-white/25 uppercase tracking-wider">or continue with email</span>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) toast.error(error.message || "Google sign-in failed");
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed");
    } finally { setIsGoogleLoading(false); }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (error) toast.error(error.message || "Apple sign-in failed");
    } catch (err: any) {
      toast.error(err?.message || "Apple sign-in failed");
    } finally { setIsAppleLoading(false); }
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <AnimatedBackground />
        <div className="relative z-10 w-full max-w-md">
          <GlassCard glowColor="hsl(260 70% 55% / 0.2)">
            <div className="text-center">
              <motion.div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.1] border border-white/[0.12]"
                animate={{ rotateY: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Shield className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-white">Two-Factor Auth</h2>
              <p className="mt-2 text-sm text-white/50">Enter the 6-digit code from your authenticator</p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-code" className="text-white/60 text-xs uppercase tracking-wider">Authentication Code</Label>
                <Input id="mfa-code" type="text" inputMode="numeric" placeholder="000000"
                  className="h-14 border-white/[0.08] bg-white/[0.04] text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-white/15 focus:border-white/20 focus:ring-white/10 backdrop-blur-sm"
                  value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && mfaCode.length === 6) handleMfaVerify(); }}
                />
              </div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button onClick={handleMfaVerify} className="w-full h-12 bg-white text-black border-0 font-bold shadow-lg hover:bg-white/90 transition-all" disabled={mfaCode.length !== 6 || verifyingMfa}>
                  {verifyingMfa ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify & Sign In"}
                </Button>
              </motion.div>
              <Button variant="ghost" className="w-full text-white/30 hover:text-white/60" onClick={() => { setMfaRequired(false); setMfaCode(""); supabase.auth.signOut(); }}>
                Back to Login
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-md">
        <GlassCard glowColor="hsl(220 80% 50% / 0.1)">
          <div className="text-center">
            <motion.div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.1] border border-white/[0.12]"
              whileHover={{ rotateY: 20, rotateX: -10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <GraduationCap className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-white/40">Sign in to your placement platform</p>
          </div>

          {/* Google Sign In */}
          <div className="mt-6">
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-white/[0.1] bg-white/[0.04] text-white font-medium hover:bg-white/[0.08] transition-all gap-3"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>
            </motion.div>
          </div>

          <Divider />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" placeholder="you@college.edu"
                className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 backdrop-blur-sm"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-white/40 hover:text-white/60 transition-colors">Forgot password?</Link>
              </div>
              <Input id="password" type="password"
                className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 backdrop-blur-sm"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full h-12 bg-white text-black border-0 font-bold shadow-lg hover:bg-white/90 transition-all" disabled={isLoading}>
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>
            </motion.div>
            <p className="text-center text-sm text-white/30">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-white/60 hover:text-white transition-colors">Sign up</Link>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
