import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirects } from "@/lib/authRedirects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { AnimatedBackground } from "@/components/3d/AnimatedBackground";
import { GlassCard } from "@/components/3d/GlassCard";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getAuthRedirects().passwordRecovery });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
      toast.info("Check your inbox and click the link.");
    } catch (err: any) { toast.error(err.message || "Failed to send reset email"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-md">
        <GlassCard glowColor="hsl(260 70% 55% / 0.15)">
          <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
          <h2 className="font-display text-2xl font-bold text-white">Reset password</h2>
          <p className="mt-2 text-sm text-white/40">Enter your email and we'll send you a reset link</p>
          <form onSubmit={handleSendCode} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-white/25" />
                <Input id="email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-white/[0.08] bg-white/[0.04] pl-10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 backdrop-blur-sm" required />
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 border-0 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
                {isLoading ? "Sending…" : "Send reset link"}
              </Button>
            </motion.div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
