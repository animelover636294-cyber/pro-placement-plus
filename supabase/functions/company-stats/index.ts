import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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

    const { data: company } = await admin
      .from('companies')
      .select('id, name, eligibility_criteria, allowed_branches, max_backlogs')
      .eq('owner_user_id', user.id)
      .maybeSingle();
    if (!company) return json({ error: 'No company is linked to this account.' }, 403);

    const { data: tests } = await admin
      .from('tests')
      .select('id, title, scheduled_date, registration_opens_at, registration_closes_at')
      .eq('company_id', company.id)
      .order('scheduled_date', { ascending: false });
    const testIds = (tests ?? []).map((t) => t.id);

    let registrations: { test_id: string; student_id: string }[] = [];
    let attempts: { test_id: string; passed: boolean | null; total_score: number | null }[] = [];
    if (testIds.length) {
      const { data: regs } = await admin.from('test_registrations').select('test_id, student_id').in('test_id', testIds);
      registrations = regs ?? [];
      const { data: atts } = await admin.from('test_attempts').select('test_id, passed, total_score').in('test_id', testIds);
      attempts = atts ?? [];
    }

    // Eligible students against this company's criteria.
    const criteria = (company.eligibility_criteria ?? {}) as Record<string, number>;
    const minCgpa = Number(criteria.min_cgpa ?? 0);
    const yearOfPassing = Number(criteria.year_of_passing ?? 0);
    const branches = (company.allowed_branches ?? []) as string[];

    const { data: studentRoles } = await admin.from('user_roles').select('user_id').eq('role', 'student');
    const studentIds = (studentRoles ?? []).map((r) => r.user_id);
    let eligibleCount = 0;
    let totalStudents = studentIds.length;
    if (studentIds.length) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, cgpa, branch, year_of_passing')
        .in('id', studentIds);
      eligibleCount = (profiles ?? []).filter((p) => {
        if (minCgpa && Number(p.cgpa ?? 0) < minCgpa) return false;
        if (yearOfPassing && Number(p.year_of_passing ?? 0) !== yearOfPassing) return false;
        if (branches.length && p.branch && !branches.some((b) => b.toLowerCase() === String(p.branch).toLowerCase()))
          return false;
        return true;
      }).length;
    }

    const perTest = (tests ?? []).map((t) => ({
      ...t,
      registrations: registrations.filter((r) => r.test_id === t.id).length,
      attempts: attempts.filter((a) => a.test_id === t.id).length,
      passed: attempts.filter((a) => a.test_id === t.id && a.passed).length,
    }));

    return json({
      company: { id: company.id, name: company.name },
      totals: {
        tests: testIds.length,
        registrations: registrations.length,
        uniqueRegisteredStudents: new Set(registrations.map((r) => r.student_id)).size,
        attempts: attempts.length,
        passed: attempts.filter((a) => a.passed).length,
        eligibleStudents: eligibleCount,
        totalStudents,
      },
      tests: perTest,
    });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
