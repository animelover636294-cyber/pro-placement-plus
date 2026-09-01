const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function base64ToBytes(b64: string) {
  const clean = b64.includes(',') ? b64.split(',')[1] : b64;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'AI is not configured.' }, 500);

    const body = await req.json().catch(() => ({}));
    const audio: unknown = body?.audio;
    const mimeType: string = typeof body?.mimeType === 'string' ? body.mimeType : 'audio/webm';

    if (typeof audio !== 'string' || audio.length < 32) {
      return json({ error: 'No audio provided.' }, 400);
    }
    // ~15 MB base64 ceiling
    if (audio.length > 20_000_000) return json({ error: 'Recording is too long. Keep it under a minute.' }, 400);

    const bytes = base64ToBytes(audio);
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('wav') ? 'wav' : 'webm';

    const form = new FormData();
    form.append('model', 'openai/gpt-4o-mini-transcribe');
    form.append('file', new Blob([bytes], { type: mimeType }), `recording.${ext}`);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'fetch' },
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const message =
        res.status === 429
          ? 'Voice input is busy right now. Please try again in a moment.'
          : res.status === 402
            ? 'AI credits are exhausted. Please contact your placement administrator.'
            : `Transcription failed (${res.status}). ${detail.slice(0, 200)}`;
      return json({ error: message }, res.status);
    }

    const data = await res.json();
    return json({ text: (data?.text ?? '').trim() });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
