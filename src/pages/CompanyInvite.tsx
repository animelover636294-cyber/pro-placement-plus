import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Loader2, Home } from "lucide-react";

export default function CompanyInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ email: string; companyName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    contactName: "", password: "", confirmPassword: "", phone: "", website: "",
    description: "", jobRole: "", salaryPackage: "", jobLocation: "", jobType: "Full-time",
    allowedBranches: "", requiredSkills: "", minCgpa: "",
  });
  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      if (!token) { setInviteError("This invitation link is missing its token."); setChecking(false); return; }
      const { data, error } = await supabase.functions.invoke("accept-company-invite", {
        body: { action: "lookup", token },
      });
      if (error || data?.error) setInviteError(data?.error ?? "We couldn't validate this invitation link.");
      else setInvite({ email: data.email, companyName: data.companyName });
      setChecking(false);
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.contactName.trim().length < 2) { toast.error("Enter the contact person name"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords don't match"); return; }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("accept-company-invite", {
      body: { action: "accept", token, ...form },
    });
    if (error || data?.error) {
      setSubmitting(false);
      toast.error(data?.error ?? "Registration failed. Please try again.");
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email, password: form.password,
    });
    setSubmitting(false);
    if (signInError) { toast.success("Account created. Please sign in."); navigate("/login"); return; }
    toast.success("Welcome aboard! Your recruiter portal is ready.");
    navigate("/company", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-2xl space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Home className="h-4 w-4" /> Go to Home
        </Link>
        <Card className="glass-card border-border/60">
          <CardHeader>
            <div className="skeuo-icon mb-3 h-12 w-12 bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div>
            <CardTitle className="font-display text-2xl">Recruiter registration</CardTitle>
            <CardDescription>
              {checking ? "Validating your invitation…" : invite
                ? `Complete the registration for ${invite.companyName} (${invite.email}).`
                : "Invitation unavailable"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checking && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</div>}

            {!checking && inviteError && (
              <div className="space-y-4">
                <p className="text-sm text-destructive">{inviteError}</p>
                <Button asChild variant="secondary"><Link to="/login">Go to sign in</Link></Button>
              </div>
            )}

            {!checking && invite && (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <h3 className="label-caps text-xs text-muted-foreground">Account</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact person *</Label>
                      <Input value={form.contactName} onChange={(e) => f("contactName", e.target.value)} placeholder="Full name" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Work email</Label>
                      <Input value={invite.email} readOnly disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input type="password" value={form.password} onChange={(e) => f("password", e.target.value)} placeholder="At least 8 characters" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm password *</Label>
                      <Input type="password" value={form.confirmPassword} onChange={(e) => f("confirmPassword", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="+91 …" />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={form.website} onChange={(e) => f("website", e.target.value)} placeholder="https://" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="label-caps text-xs text-muted-foreground">Hiring details</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-2">
                      <Label>About the company</Label>
                      <Textarea rows={2} value={form.description} onChange={(e) => f("description", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Job role</Label>
                      <Input value={form.jobRole} onChange={(e) => f("jobRole", e.target.value)} placeholder="Software Engineer" />
                    </div>
                    <div className="space-y-2">
                      <Label>Package</Label>
                      <Input value={form.salaryPackage} onChange={(e) => f("salaryPackage", e.target.value)} placeholder="8-12 LPA" />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={form.jobLocation} onChange={(e) => f("jobLocation", e.target.value)} placeholder="Bangalore" />
                    </div>
                    <div className="space-y-2">
                      <Label>Job type</Label>
                      <Select value={form.jobType} onValueChange={(v) => f("jobType", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                          <SelectItem value="Internship + FTE">Internship + FTE</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum CGPA</Label>
                      <Input type="number" step="0.1" value={form.minCgpa} onChange={(e) => f("minCgpa", e.target.value)} placeholder="7.0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Allowed branches</Label>
                      <Input value={form.allowedBranches} onChange={(e) => f("allowedBranches", e.target.value)} placeholder="CSE, ISE, ECE" />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Priority skills</Label>
                      <Input value={form.requiredSkills} onChange={(e) => f("requiredSkills", e.target.value)} placeholder="React, SQL, DSA" />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full font-bold" disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</> : "Create recruiter account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
