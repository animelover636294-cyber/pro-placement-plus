const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testTitle, totalScore, passed, scores, questions, answers } = await req.json();
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const subjectBreakdown = Object.entries(scores as Record<string, number>)
      .map(([sub, score]) => `- ${sub}: ${score}%`)
      .join('\n');

    const prompt = `A student just completed a placement test "${testTitle}" and scored ${totalScore}% overall. They ${passed ? 'passed' : 'did not pass'}.

Subject-wise scores:
${subjectBreakdown}

Provide personalized feedback in 3-4 paragraphs:
1. Overall performance summary
2. Subject-specific strengths and weaknesses
3. Concrete improvement recommendations with specific study topics
4. A motivational note

Keep it concise, actionable, and encouraging. Write in second person ("You scored...").`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || 'Unable to generate feedback at this time.';

    return new Response(JSON.stringify({ feedback }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
