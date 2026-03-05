import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, UserPlus, ScrollText, KeyRound, Loader2, Trash2 } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground">Manage admin security, invites, and audit trail</p>
      </div>
      <Tabs defaultValue="mfa">
        <TabsList>
          <TabsTrigger value="mfa"><KeyRound className="mr-1 h-4 w-4" /> Two-Factor Auth</TabsTrigger>
          <TabsTrigger value="password"><Shield className="mr-1 h-4 w-4" /> Change Password</TabsTrigger>
          <TabsTrigger value="invites"><UserPlus className="mr-1 h-4 w-4" /> Admin Invites</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="mr-1 h-4 w-4" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="mfa"><MFASection /></TabsContent>
        <TabsContent value="password"><AdminPasswordReset /></TabsContent>
        <TabsContent value="invites"><InviteSection /></TabsContent>
        <TabsContent value="audit"><AuditSection /></TabsContent>
      </Tabs>
    </div>
  );
}

function MFASection() {
  const { user } = useAuth();
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(true);
  const { log } = useAuditLog();

  // Delete 2FA state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFactorId, setDeleteFactorId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [deletingMfa, setDeletingMfa] = useState(false);

  const fetchFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchFactors(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "SmartPlace Admin",
      friendlyName: "Google Authenticator",
    });
    if (error) { toast.error(error.message); setEnrolling(false); return; }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
  };

  const verifyEnroll = async () => {
    if (!factorId) return;
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) { toast.error(challenge.error.message); return; }
    const verify = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: verifyCode });
    if (verify.error) { toast.error(verify.error.message); return; }
    toast.success("2FA enabled with Google Authenticator!");
    await log("mfa_enrolled", "auth");
    setQrCode(null); setSecret(null); setFactorId(null); setVerifyCode(""); setEnrolling(false);
    fetchFactors();
  };

  const openDeleteDialog = (id: string) => {
    setDeleteFactorId(id);
    setDeleteDialogOpen(true);
    setOtpSent(false);
    setEmailOtp("");
  };

  const sendEmailOtp = async () => {
    if (!user?.email) return;
    setSendingOtp(true);
    // Use Supabase's built-in OTP for email verification
    const { error } = await supabase.auth.signInWithOtp({ email: user.email });
    setSendingOtp(false);
    if (error) { toast.error(error.message); return; }
    setOtpSent(true);
    toast.success(`Verification code sent to ${user.email}`);
  };

  const confirmDeleteMfa = async () => {
    if (!deleteFactorId || !user?.email) return;
    setDeletingMfa(true);

    // Verify the email OTP first
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: user.email,
      token: emailOtp,
      type: "email",
    });

    if (verifyError) {
      toast.error("Invalid verification code. Please try again.");
      setDeletingMfa(false);
      return;
    }

    // Now unenroll the MFA factor
    const { error } = await supabase.auth.mfa.unenroll({ factorId: deleteFactorId });
    setDeletingMfa(false);
    if (error) { toast.error(error.message); return; }

    toast.success("2FA has been removed successfully");
    await log("mfa_unenrolled", "auth");
    setDeleteDialogOpen(false);
    setDeleteFactorId(null);
    setEmailOtp("");
    setOtpSent(false);
    fetchFactors();
  };

  const verified = factors.filter((f) => f.status === "verified");

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Two-Factor Authentication</CardTitle>
          <CardDescription>Secure your admin account with Google Authenticator (TOTP-based 2FA)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Active factors:</p>
              {verified.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Enabled</Badge>
                    <span className="text-sm">{f.friendly_name ?? "Google Authenticator"}</span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(f.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!enrolling && verified.length === 0 && (
            <Button onClick={startEnroll}><KeyRound className="mr-1 h-4 w-4" /> Enable 2FA with Google Authenticator</Button>
          )}

          {qrCode && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Scan this QR code with Google Authenticator:</p>
              <div className="flex justify-center">
                <img src={qrCode} alt="TOTP QR Code for Google Authenticator" className="h-48 w-48 rounded-lg border p-2 bg-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Can't scan? Enter this key manually in Google Authenticator:</p>
                <code className="block rounded bg-muted px-3 py-2 text-sm font-mono select-all break-all">{secret}</code>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Enter 6-digit code" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} maxLength={6} className="max-w-[200px]" />
                <Button onClick={verifyEnroll} disabled={verifyCode.length !== 6}>Verify & Enable</Button>
                <Button variant="ghost" onClick={() => { setEnrolling(false); setQrCode(null); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete 2FA Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              For security, verify your identity via email before removing 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!otpSent ? (
              <Button onClick={sendEmailOtp} disabled={sendingOtp} className="w-full">
                {sendingOtp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : "Send Verification Code to Email"}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <strong>{user?.email}</strong></p>
                <Input
                  placeholder="Enter 6-digit email code"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            {otpSent && (
              <Button variant="destructive" onClick={confirmDeleteMfa} disabled={emailOtp.length !== 6 || deletingMfa}>
                {deletingMfa ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing…</> : "Confirm & Remove 2FA"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminPasswordReset() {
  const { user } = useAuth();
  const [step, setStep] = useState<"start" | "verify" | "newpass">("start");
  const [emailOtp, setEmailOtp] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMfa, setHasMfa] = useState(false);
  const { log } = useAuditLog();

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = (data?.totp ?? []).filter((f: any) => f.status === "verified");
      setHasMfa(verified.length > 0);
    });
  }, []);

  const sendOtp = async () => {
    if (!user?.email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: user.email });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Verification code sent to your email");
    setStep("verify");
  };

  const verifyBoth = async () => {
    if (!user?.email) return;
    setLoading(true);

    // Verify email OTP
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: user.email,
      token: emailOtp,
      type: "email",
    });
    if (otpError) {
      toast.error("Invalid email verification code");
      setLoading(false);
      return;
    }

    // Verify TOTP if MFA is enabled
    if (hasMfa) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = (factors?.totp ?? []).find((f: any) => f.status === "verified");
      if (factor) {
        const { data: challenge, error: chalError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
        if (chalError) { toast.error(chalError.message); setLoading(false); return; }
        const { error: verError } = await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId: challenge.id,
          code: totpCode,
        });
        if (verError) {
          toast.error("Invalid 2FA code");
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    toast.success("Identity verified!");
    setStep("newpass");
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password changed successfully!");
    await log("password_changed", "auth");
    setStep("start");
    setEmailOtp("");
    setTotpCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Change Password</CardTitle>
        <CardDescription>
          {hasMfa
            ? "Both email verification and 2FA code are required to change your password"
            : "Email verification is required to change your password"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "start" && (
          <Button onClick={sendOtp} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : "Start Password Change"}
          </Button>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Verification Code</Label>
              <p className="text-sm text-muted-foreground">Enter the code sent to <strong>{user?.email}</strong></p>
              <Input value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} placeholder="6-digit code" maxLength={6} />
            </div>
            {hasMfa && (
              <div className="space-y-2">
                <Label>2FA Code (Google Authenticator)</Label>
                <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="6-digit 2FA code" maxLength={6} />
              </div>
            )}
            <Button onClick={verifyBoth} disabled={loading || emailOtp.length !== 6 || (hasMfa && totpCode.length !== 6)}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify Identity"}
            </Button>
          </div>
        )}

        {step === "newpass" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" minLength={6} />
            </div>
            <Button onClick={changePassword} disabled={loading || !newPassword || !confirmPassword}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing…</> : "Change Password"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InviteSection() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const { log } = useAuditLog();

  useEffect(() => {
    supabase.from("admin_invites").select("*").order("created_at", { ascending: false }).then(({ data }) => setInvites(data ?? []));
  }, []);

  const sendInvite = async () => {
    if (!email || !user) return;
    setSending(true);
    const { data, error } = await supabase.from("admin_invites").insert({ email, invited_by: user.id }).select().single();
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Invite sent to ${email}`);
    await log("admin_invited", "admin_invites", data.id, { email });
    setEmail("");
    setInvites((prev) => [data, ...prev]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Admin Invites</CardTitle>
        <CardDescription>Only invited users can become admins. Share the invite token securely.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="admin@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-sm" />
          <Button onClick={sendInvite} disabled={sending || !email}>
            {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
            Send Invite
          </Button>
        </div>

        {invites.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.email}</TableCell>
                  <TableCell><code className="rounded bg-muted px-1 text-xs">{inv.token.slice(0, 12)}…</code></TableCell>
                  <TableCell>
                    <Badge variant={inv.accepted_at ? "default" : new Date(inv.expires_at) < new Date() ? "destructive" : "secondary"}>
                      {inv.accepted_at ? "Accepted" : new Date(inv.expires_at) < new Date() ? "Expired" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.expires_at).toLocaleDateString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AuditSection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setLogs(data ?? []); setLoading(false); });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ScrollText className="h-5 w-5" /> Audit Log</CardTitle>
        <CardDescription>Recent admin actions for accountability and security review</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No audit logs yet</TableCell></TableRow>
            ) : (
              logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true })}
                  </TableCell>
                  <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                  <TableCell className="text-sm">{l.entity_type}{l.entity_id ? ` #${l.entity_id.slice(0, 8)}` : ""}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {Object.keys(l.details as object).length > 0 ? JSON.stringify(l.details) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
