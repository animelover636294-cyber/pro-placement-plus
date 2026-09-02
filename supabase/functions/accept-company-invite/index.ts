import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
const list = (v: unknown) =>
  str(v, 2000).split(',').map((s) => s.trim()).filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = str(body?.action, 20) || 'lookup';
    const token = str(body?.token, 200);
    if (!/^[a-f0-9]{20,128}$/i.test(token)) return json({ error: 'Invalid invitation link.' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: invite } = await admin
      .from('company_invites')
      .select('id, email, company_name, company_id, accepted_at, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (!invite) return json({ error: 'This invitation link is not valid.' }, 404);
    if (invite.accepted_at) return json({ error: 'This invitation has already been used. Please sign in.' }, 409);
    if (new Date(invite.expires_at).getTime() < Date.now())
      return json({ error: 'This invitation has expired. Ask the placement team for a new one.' }, 410);

    if (action === 'lookup') {
      return json({ email: invite.email, companyName: invite.company_name, expiresAt: invite.expires_at });
    }

    if (action !== 'accept') return json({ error: 'Unsupported action.' }, 400);

    const password = String(body?.password ?? '');
    const contactName = str(body?.contactName, 120);
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400);
    if (contactName.length < 2) return json({ error: 'Enter the contact person name.' }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { name: contactName, company_name: invite.company_name },
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message ?? 'Could not create the account.';
      return json({ error: /already/i.test(msg) ? 'An account already exists for this email. Please sign in.' : msg }, 400);
    }
    const userId = created.user.id;

    // Promote the auto-assigned student role to the company role.
    await admin.from('user_roles').delete().eq('user_id', userId);
    const { error: roleErr } = await admin.from('user_roles').insert({ user_id: userId, role: 'company' });
    if (roleErr) return json({ error: roleErr.message }, 400);

    await admin.from('profiles').update({ name: contactName, email: invite.email }).eq('id', userId);

    const companyPayload: Record<string, unknown> = {
      owner_user_id: userId,
      contact_email: invite.email,
      contact_info: {
        contact_name: contactName,
        phone: str(body?.phone, 40),
        website: str(body?.website, 200),
      },
    };
    if (str(body?.description, 4000)) companyPayload.description = str(body?.description, 4000);
    if (str(body?.jobRole)) companyPayload.job_role = str(body?.jobRole);
    if (str(body?.salaryPackage)) companyPayload.salary_package = str(body?.salaryPackage);
    if (str(body?.jobLocation)) companyPayload.job_location = str(body?.jobLocation);
    if (str(body?.jobType)) companyPayload.job_type = str(body?.jobType);
    if (list(body?.allowedBranches).length) companyPayload.allowed_branches = list(body?.allowedBranches);
    if (list(body?.requiredSkills).length) companyPayload.skills_priority = list(body?.requiredSkills);
    const minCgpa = Number(body?.minCgpa);
    if (Number.isFinite(minCgpa) && minCgpa > 0) {
      companyPayload.eligibility_criteria = { min_cgpa: minCgpa, skills_cutoff: 0, year_of_passing: 0 };
    }

    let companyId = invite.company_id as string | null;
    if (companyId) {
      await admin.from('companies').update(companyPayload).eq('id', companyId);
    } else {
      const { data: newCompany, error: cErr } = await admin
        .from('companies')
        .insert({ name: invite.company_name, ...companyPayload })
        .select('id')
        .single();
      if (cErr) return json({ error: cErr.message }, 400);
      companyId = newCompany.id;
      await admin.from('company_invites').update({ company_id: companyId }).eq('id', invite.id);
    }

    await admin
      .from('company_invites')
      .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
      .eq('id', invite.id);

    return json({ success: true, email: invite.email, companyId });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
