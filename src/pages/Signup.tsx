import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { AnimatedBackground } from "@/components/3d/AnimatedBackground";
import { GlassCard } from "@/components/3d/GlassCard";
import { motion } from "framer-motion";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

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
        <GlassCard glowColor="hsl(260 70% 55% / 0.15)">
          <div className="text-center">
            <motion.div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, hsl(260 70% 55%), hsl(220 80% 50%))",
                boxShadow: "0 15px 40px -10px hsl(260 70% 55% / 0.4)",
              }}
              whileHover={{ rotateY: 20, rotateX: -10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <GraduationCap className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-white">Create an account</h2>
            <p className="mt-2 text-sm text-white/40">Join the smart placement platform</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/60 text-xs uppercase tracking-wider">Full Name</Label>
              <Input id="name" placeholder="John Doe" className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 backdrop-blur-sm" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" placeholder="you@college.edu" className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 backdrop-blur-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
              <Input id="password" type="password" placeholder="Min 6 characters" className="h-12 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 backdrop-blur-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 border-0 font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" disabled={isLoading}>
                {isLoading ? "Creating account…" : "Create account"}
              </Button>
            </motion.div>
            <p className="text-center text-sm text-white/30">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary/80 hover:text-primary transition-colors">Sign in</Link>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
