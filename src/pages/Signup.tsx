import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

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
    <div className="relative flex min-h-screen items-center justify-center bg-dark-surface px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-white/5 bg-dark-elevated p-8 shadow-3d">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-3d-primary">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Create an account</h2>
            <p className="mt-1 text-sm text-white/50">Join the smart placement platform</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Full Name</Label>
              <Input id="name" placeholder="John Doe" className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-primary" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input id="email" type="email" placeholder="you@college.edu" className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-primary" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <Input id="password" type="password" placeholder="Min 6 characters" className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-primary" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary border-0 font-bold shadow-3d-primary hover:opacity-90 transition-all" disabled={isLoading}>
              {isLoading ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-white/40">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
