const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText } = await req.json();
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const prompt = `You are a question extractor. Below is the text content from a question bank PDF. Extract ALL questions from it and return them as a JSON array.

For each question, determine if it's MCQ or coding type.

Return a JSON array with this exact structure:
[
  {
    "id": "unique-uuid",
    "type": "mcq" or "coding",
    "subject": "detected subject",
    "topic": "detected topic or empty string",
    "text": "the question text",
    "options": ["A option", "B option", "C option", "D option"],
    "correct_answer": "A/B/C/D for MCQ, or expected answer for coding",
    "points": 1
  }
]

For MCQ questions: include options array and correct_answer as letter (A/B/C/D).
For coding questions: omit options, set correct_answer to expected output.
If you can detect the correct answer from the document, include it. Otherwise make your best judgment.

Return ONLY the JSON array, no markdown or explanation.

PDF Content:
${pdfText}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    let questions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      questions = [];
    }

    questions = questions.map((q: Record<string, unknown>) => ({
      ...q,
      id: q.id || crypto.randomUUID(),
    }));

    return new Response(JSON.stringify({ questions }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
