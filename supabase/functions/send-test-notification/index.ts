const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testId, testTitle, scheduledDate } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all student user IDs
    const { data: studentRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (rolesError) throw rolesError;

    const studentIds = (studentRoles || []).map(r => r.user_id);

    if (studentIds.length === 0) {
      return new Response(JSON.stringify({ success: true, notifiedCount: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create in-app notifications for all students
    const notifications = studentIds.map(userId => ({
      user_id: userId,
      title: '📝 New Test Scheduled',
      message: `"${testTitle}" has been scheduled for ${scheduledDate}. Log in to prepare and take the test.`,
      type: 'test_scheduled',
      link: '/dashboard/tests',
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) throw insertError;

    console.log(`Created ${studentIds.length} in-app notifications for test: ${testTitle}`);

    return new Response(JSON.stringify({
      success: true,
      notifiedCount: studentIds.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
