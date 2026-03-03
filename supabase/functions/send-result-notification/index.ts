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
    const { studentId, testTitle, totalScore, passed } = await req.json();

    if (!studentId || !testTitle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const emoji = passed ? '🎉' : '📊';
    const status = passed ? 'Passed' : 'Failed';

    const { error } = await supabase.from('notifications').insert({
      user_id: studentId,
      title: `${emoji} Test Results Ready`,
      message: `Your results for "${testTitle}" are ready. You scored ${totalScore}% (${status}). Check your results for detailed feedback.`,
      type: 'test_result',
      link: '/dashboard/results',
    });

    if (error) throw error;

    console.log(`Result notification sent to student ${studentId} for test: ${testTitle}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
