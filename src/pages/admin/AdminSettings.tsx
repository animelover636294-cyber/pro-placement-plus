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
import { toast } from "sonner";
import { Shield, UserPlus, ScrollText, KeyRound, Loader2 } from "lucide-react";
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
          <TabsTrigger value="invites"><UserPlus className="mr-1 h-4 w-4" /> Admin Invites</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="mr-1 h-4 w-4" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="mfa"><MFASection /></TabsContent>
        <TabsContent value="invites"><InviteSection /></TabsContent>
        <TabsContent value="audit"><AuditSection /></TabsContent>
      </Tabs>
    </div>
  );
}

function MFASection() {
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(true);
  const { log } = useAuditLog();

  const fetchFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchFactors(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator App" });
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
    toast.success("2FA enabled successfully!");
    await log("mfa_enrolled", "auth");
    setQrCode(null); setSecret(null); setFactorId(null); setVerifyCode(""); setEnrolling(false);
    fetchFactors();
  };

  const unenroll = async (id: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { toast.error(error.message); return; }
    toast.success("2FA factor removed");
    await log("mfa_unenrolled", "auth");
    fetchFactors();
  };

  const verified = factors.filter((f) => f.status === "verified");

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Two-Factor Authentication</CardTitle>
        <CardDescription>Add an extra layer of security with TOTP-based 2FA using an authenticator app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verified.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Active factors:</p>
            {verified.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Enabled</Badge>
                  <span className="text-sm">{f.friendly_name ?? "TOTP"}</span>
                </div>
                <Button variant="destructive" size="sm" onClick={() => unenroll(f.id)}>Remove</Button>
              </div>
            ))}
          </div>
        )}

        {!enrolling && verified.length === 0 && (
          <Button onClick={startEnroll}><KeyRound className="mr-1 h-4 w-4" /> Enable 2FA</Button>
        )}

        {qrCode && (
          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Scan this QR code with your authenticator app:</p>
            <div className="flex justify-center">
              <img src={qrCode} alt="TOTP QR Code" className="h-48 w-48" />
            </div>
            <p className="text-xs text-muted-foreground">Or enter manually: <code className="rounded bg-muted px-1">{secret}</code></p>
            <div className="flex gap-2">
              <Input placeholder="Enter 6-digit code" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} maxLength={6} className="max-w-[200px]" />
              <Button onClick={verifyEnroll} disabled={verifyCode.length !== 6}>Verify & Enable</Button>
              <Button variant="ghost" onClick={() => { setEnrolling(false); setQrCode(null); }}>Cancel</Button>
            </div>
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
