const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const KNOWLEDGE = `INTELLIGENT PLACEMENT MANAGEMENT SYSTEM (IPMS)

WHAT IT IS
A campus placement management and AI-proctored assessment platform for colleges. It replaces scattered spreadsheets, WhatsApp groups and manual test coordination with one secure portal used by placement officers (admins) and students.

THE PROBLEM IT SOLVES
- Placement drives are coordinated manually, so eligibility checks, shortlists and results are slow and error-prone.
- Online mock/placement tests are easy to cheat in without proctoring.
- Students get no personalised, data-backed feedback on where they stand.

CORE FEATURES
1. Authentication & roles — email/password plus Google sign-in, separate Admin and Student roles, mandatory two-factor authentication (TOTP) for admins, secure password recovery.
2. Company management — admins add companies with job role, package, location, bond details, selection process, allowed branches, CGPA/backlog criteria and priority skills.
3. Student profiles — identity, USN, branch, semester, skills, resume upload, and marks-card upload verified by AI vision with automatic CGPA calculation from SGPAs.
4. Eligibility engine — a student's academics and skills are cross-checked against each company's criteria, showing exactly which requirements are met or missing.
5. Assessment engine — admins create tests, generate question banks with AI or import them from PDFs, set duration, per-student question count and pass criteria; questions are randomised per student.
6. Secure test-taking — the test forces fullscreen lockdown, blocks tab-switch and window shortcuts, tracks violations and auto-submits on repeated violations.
7. AI webcam proctoring — the webcam detects phones and other digital gadgets in real time, warns once with a countdown, and auto-submits on repeat detection. Admins tune confidence thresholds and allowlists per test and can mark false positives.
8. Question navigator — a sidebar shows answered/unanswered questions with green ticks, and progress survives a page refresh.
9. Results & AI feedback — automatic scoring with subject-wise breakdown, pass/fail, answer review, and AI explanations of mistakes plus personalised improvement plans.
10. Retakes — up to two attempts, with a mandatory reason for a retake and a separate retake question bank.
11. Leaderboards & analytics — student rankings, top-3 podium, performance trends and charts for admins.
12. Reports — filterable admin reports with proctoring timelines and CSV/Excel/PDF exports.
13. Notifications — in-app and email alerts for schedules, new companies and results.
14. Student Assistant — a private AI assistant inside each student's account that can see only that student's own profile and assessment data and coaches them on their performance.

TECHNOLOGY
React + Vite + TypeScript, Tailwind CSS and shadcn/ui, Framer Motion, TensorFlow.js (COCO-SSD) for gadget detection, and a managed cloud backend providing Postgres with row-level security, authentication, storage and edge functions. AI features run through a server-side AI gateway.

FUTURE ENHANCEMENTS
Mobile app, interview scheduling with recruiters, AI mock interviews, resume scoring, and predictive placement analytics.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'AI is not configured.' }, 500);

    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
          .filter((m: ChatMessage) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
          .slice(-16)
          .map((m: ChatMessage) => ({ role: m.role, content: m.content.slice(0, 4000) }))
      : [];
    if (messages.length === 0) return json({ error: 'No message provided.' }, 400);

    const system = `You are the site guide for the Intelligent Placement Management System (IPMS) website. Answer visitor questions about what this website does, the problem it solves, its features, how students and admins use it, and the technology behind it.

Rules:
- Answer only from the knowledge base below. If something is not covered, say you don't have that detail and suggest signing in or contacting the placement office.
- You have NO access to any student data, results or accounts. Never claim otherwise.
- Be friendly and brief: 2-5 sentences or a short bullet list. Use markdown sparingly.

KNOWLEDGE BASE:
${KNOWLEDGE}`;

    const input = [
      { role: 'system', content: [{ type: 'input_text', text: system }] },
      ...messages.map((m) => ({
        role: m.role,
        content: [{ type: m.role === 'assistant' ? 'output_text' : 'input_text', text: m.content }],
      })),
    ];

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({ model: 'openai/gpt-5.6-sol', input, stream: true, store: false }),
    });

    if (!aiRes.ok || !aiRes.body) {
      const detail = await aiRes.text().catch(() => '');
      const message =
        aiRes.status === 429
          ? 'Too many questions at once. Please try again in a moment.'
          : aiRes.status === 402
            ? 'The assistant is temporarily unavailable. Please try again later.'
            : `Assistant error (${aiRes.status}). ${detail.slice(0, 200)}`;
      return json({ error: message }, aiRes.status);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = aiRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const evt = JSON.parse(payload);
                if (evt.type === 'response.output_text.delta' && typeof evt.delta === 'string') {
                  controller.enqueue(encoder.encode(evt.delta));
                }
              } catch { /* ignore partial frames */ }
            }
          }
        } catch (_e) {
          controller.enqueue(encoder.encode('\n\n_The response was interrupted. Please try again._'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
