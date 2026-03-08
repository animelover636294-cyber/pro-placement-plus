import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";
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

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signUp } = useAuth();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message || "Google sign-in failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    setIsLoading(false);
    if (error) { toast.error(error.message); } else { toast.success("Check your email to verify your account!"); }
  };

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
            <h2 className="font-display text-2xl font-bold text-white">Create an account</h2>
            <p className="mt-2 text-sm text-white/40">Join the smart placement platform</p>
          </div>

          {/* Google Sign Up */}
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
              <Label htmlFor="name" className="text-white/60 text-xs uppercase tracking-wider">Full Name</Label>
              <Input id="name" placeholder="John Doe" className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 backdrop-blur-sm" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" placeholder="you@college.edu" className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 backdrop-blur-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
              <Input id="password" type="password" placeholder="Min 6 characters" className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 backdrop-blur-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full h-12 bg-white text-black border-0 font-bold shadow-lg hover:bg-white/90 transition-all" disabled={isLoading}>
                {isLoading ? "Creating account…" : "Create account"}
              </Button>
            </motion.div>
            <p className="text-center text-sm text-white/30">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-white/60 hover:text-white transition-colors">Sign in</Link>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
