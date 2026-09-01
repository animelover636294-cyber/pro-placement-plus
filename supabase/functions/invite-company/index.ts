import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Not authenticated.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await anonClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: 'Not authenticated.' }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) return json({ error: 'Administrator access required.' }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();
    const companyName = String(body?.companyName ?? '').trim();
    const companyId: string | null = body?.companyId ? String(body.companyId) : null;
    const origin = String(body?.origin ?? '').replace(/\/+$/, '');

    if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
    if (companyName.length < 2 || companyName.length > 120) return json({ error: 'Enter a valid company name.' }, 400);
    if (!/^https?:\/\//.test(origin)) return json({ error: 'Missing app origin.' }, 400);

    // Reuse or create the company record this invite is bound to.
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId) {
      const { data: existing } = await admin.from('companies').select('id').ilike('name', companyName).maybeSingle();
      if (existing) {
        resolvedCompanyId = existing.id;
      } else {
        const { data: created, error: createErr } = await admin
          .from('companies')
          .insert({ name: companyName, contact_email: email })
          .select('id')
          .single();
        if (createErr) return json({ error: createErr.message }, 400);
        resolvedCompanyId = created.id;
      }
    }
    await admin.from('companies').update({ contact_email: email }).eq('id', resolvedCompanyId);

    const { data: invite, error: inviteErr } = await admin
      .from('company_invites')
      .insert({ email, company_name: companyName, company_id: resolvedCompanyId, invited_by: user.id })
      .select('id, token, expires_at')
      .single();
    if (inviteErr) return json({ error: inviteErr.message }, 400);

    const link = `${origin}/company-invite?token=${invite.token}`;
    const expires = new Date(invite.expires_at).toLocaleDateString('en-IN', { dateStyle: 'medium' });

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#0a0a0f;padding:32px;color:#e8e8f0">
        <div style="max-width:560px;margin:0 auto;background:#131320;border:1px solid #26263a;border-radius:16px;padding:32px">
          <h1 style="margin:0 0 8px;font-size:20px;color:#ffffff">You're invited to the Intelligent Placement Management System</h1>
          <p style="color:#a5a5bd;line-height:1.6;margin:0 0 20px">
            Hello ${companyName}, our campus placement team has invited you to join IPMS as a recruiting partner.
            With your recruiter account you can publish job roles, create and schedule assessments,
            set a registration window for students, and generate reports for your own tests.
          </p>
          <a href="${link}" style="display:inline-block;background:#6C5CE7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">
            Accept invitation
          </a>
          <p style="color:#7a7a94;font-size:12px;margin-top:24px;line-height:1.6">
            This invitation expires on ${expires}. If the button doesn't work, paste this link into your browser:<br />
            <span style="color:#9d92ff;word-break:break-all">${link}</span>
          </p>
        </div>
      </div>`;

    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailed = false;
    let emailError: string | null = null;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const { error } = await resend.emails.send({
        from: 'IPMS Placements <onboarding@resend.dev>',
        to: [email],
        subject: `Recruiter invitation — Intelligent Placement Management System`,
        html,
      });
      if (error) emailError = error.message;
      else emailed = true;
    } else {
      emailError = 'Email service is not configured.';
    }

    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'company_invited',
      entity_type: 'company_invite',
      entity_id: invite.id,
      details: { email, company_name: companyName, emailed },
    });

    return json({ success: true, emailed, emailError, link, inviteId: invite.id });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
