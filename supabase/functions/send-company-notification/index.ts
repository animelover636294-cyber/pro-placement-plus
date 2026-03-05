const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@6';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, action, eligibility } = await req.json();

    if (!companyName || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: studentRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (rolesError) throw rolesError;

    const studentIds = (studentRoles || []).map((r: { user_id: string }) => r.user_id);

    if (studentIds.length === 0) {
      return new Response(JSON.stringify({ success: true, notifiedCount: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let title: string;
    let message: string;

    if (action === 'added') {
      title = '🏢 New Company Visit';
      message = `"${companyName}" has been added as a placement partner.`;
    } else {
      title = '📋 Company Eligibility Updated';
      message = `Eligibility criteria for "${companyName}" have been updated.`;
    }

    if (eligibility) {
      const parts: string[] = [];
      if (eligibility.min_cgpa) parts.push(`Min CGPA: ${eligibility.min_cgpa}`);
      if (eligibility.year_of_passing) parts.push(`Year: ${eligibility.year_of_passing}`);
      if (eligibility.skills_cutoff) parts.push(`Skills Cutoff: ${eligibility.skills_cutoff}%`);
      if (parts.length > 0) message += ` Criteria: ${parts.join(', ')}.`;
    }

    // In-app notifications
    const notifications = studentIds.map((userId: string) => ({
      user_id: userId,
      title,
      message,
      type: 'company_update',
      link: '/dashboard/schedule',
    }));

    const { error: insertError } = await supabase.from('notifications').insert(notifications);
    if (insertError) throw insertError;

    // Email notifications
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', studentIds);

      if (profiles && profiles.length > 0) {
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
        const emailPromises = profiles
          .filter(p => p.email)
          .map(p =>
            resend.emails.send({
              from: 'SmartPlace <onboarding@resend.dev>',
              to: p.email!,
              subject: title,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                  <h2 style="color: #1a1a2e;">Hi ${p.name || 'Student'},</h2>
                  <p style="color: #555; line-height: 1.6;">${message}</p>
                  <p style="color: #555;">Log in to SmartPlace to check your eligibility and prepare!</p>
                </div>
              `,
            })
          );
        await Promise.allSettled(emailPromises);
      }
    } catch (emailErr) {
      console.error('Email batch send failed (non-blocking):', emailErr);
    }

    console.log(`Created ${studentIds.length} company notifications for: ${companyName} (${action})`);

    return new Response(JSON.stringify({ success: true, notifiedCount: studentIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
