const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer']);

/** Strip markdown so the speech sounds natural. */
function toPlainText(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/(\*\*|__|\*|_|~~)/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'AI is not configured.' }, 500);

    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.text === 'string' ? body.text : '';
    const voice = typeof body?.voice === 'string' && VOICES.has(body.voice) ? body.voice : 'alloy';

    const text = toPlainText(raw).slice(0, 4000);
    if (!text) return json({ error: 'Nothing to read aloud.' }, 400);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({ model: 'openai/gpt-4o-mini-tts', input: text, voice, response_format: 'mp3' }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const message =
        res.status === 429
          ? 'Voice output is busy right now. Please try again in a moment.'
          : res.status === 402
            ? 'AI credits are exhausted. Please contact your placement administrator.'
            : `Speech generation failed (${res.status}). ${detail.slice(0, 200)}`;
      return json({ error: message }, res.status);
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    return new Response(buf, {
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
