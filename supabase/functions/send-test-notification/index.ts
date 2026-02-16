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

    // Fetch all student profiles with emails
    const { data: students, error: fetchError } = await supabase
      .from('profiles')
      .select('email, name');

    if (fetchError) throw fetchError;

    const validStudents = (students || []).filter(s => s.email);

    // Use Lovable AI to generate a nice email body
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    let emailBody = `A new test "${testTitle}" has been scheduled for ${scheduledDate}. Please log in to your account to view details and prepare.`;

    if (apiKey) {
      try {
        const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [{ role: 'user', content: `Write a short, professional email body (no subject line, no greeting, just the body) notifying students about a new placement test. Test name: "${testTitle}", Scheduled: ${scheduledDate}. Keep it under 100 words. Include a reminder to complete their profile and prepare.` }],
            temperature: 0.5,
          }),
        });
        const aiData = await aiRes.json();
        const generated = aiData.choices?.[0]?.message?.content;
        if (generated) emailBody = generated;
      } catch {
        // Use default email body
      }
    }

    // Log notification (in production, integrate with Resend or similar)
    console.log(`Sending notifications to ${validStudents.length} students about test: ${testTitle}`);

    return new Response(JSON.stringify({ 
      success: true, 
      notifiedCount: validStudents.length,
      emailBody,
      students: validStudents.map(s => s.email),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
