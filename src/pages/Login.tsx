import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Shield, Loader2 } from "lucide-react";
import { AnimatedBackground } from "@/components/3d/AnimatedBackground";
import { GlassCard } from "@/components/3d/GlassCard";
import { motion } from "framer-motion";

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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <AnimatedBackground />
        <div className="relative z-10 w-full max-w-md">
          <GlassCard glowColor="hsl(260 70% 55% / 0.2)">
            <div className="text-center">
              <motion.div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, hsl(260 70% 55%), hsl(220 80% 50%))",
                  boxShadow: "0 15px 40px -10px hsl(260 70% 55% / 0.4)",
                }}
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
                  className="h-14 border-white/[0.08] bg-white/[0.04] text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-white/15 focus:border-primary/50 focus:ring-primary/20 backdrop-blur-sm"
                  value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && mfaCode.length === 6) handleMfaVerify(); }}
                />
              </div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button onClick={handleMfaVerify} className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 border-0 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={mfaCode.length !== 6 || verifyingMfa}>
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
        <GlassCard glowColor="hsl(220 80% 50% / 0.15)">
          <div className="text-center">
            <motion.div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, hsl(220 80% 55%), hsl(260 70% 55%))",
                boxShadow: "0 15px 40px -10px hsl(220 80% 50% / 0.4)",
              }}
              whileHover={{ rotateY: 20, rotateX: -10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <GraduationCap className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-white/40">Sign in to your placement platform</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" placeholder="you@college.edu"
                className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 backdrop-blur-sm"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary/80 hover:text-primary transition-colors">Forgot password?</Link>
              </div>
              <Input id="password" type="password"
                className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 backdrop-blur-sm"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 border-0 font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" disabled={isLoading}>
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>
            </motion.div>
            <p className="text-center text-sm text-white/30">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary/80 hover:text-primary transition-colors">Sign up</Link>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
