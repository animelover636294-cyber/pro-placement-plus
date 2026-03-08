import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirects } from "@/lib/authRedirects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

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
    <div className="relative flex min-h-screen items-center justify-center bg-dark-surface px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-white/5 bg-dark-elevated p-8 shadow-3d">
          <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
          <h2 className="font-display text-2xl font-bold text-white">Reset password</h2>
          <p className="mt-1 text-sm text-white/50">Enter your email and we'll send you a reset link</p>
          <form onSubmit={handleSendCode} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                <Input id="email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/20 focus:border-primary" required />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-primary border-0 font-bold shadow-3d-primary hover:opacity-90 transition-all" disabled={isLoading}>
              {isLoading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
