const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const authHeaders = (accessToken?: string | null) => ({
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${accessToken ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
});

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/** Sends recorded audio to the speech-to-text function and returns the transcript. */
export async function transcribeAudio(blob: Blob, accessToken?: string | null): Promise<string> {
  const audio = await blobToBase64(blob);
  const res = await fetch(`${FUNCTIONS_BASE}/speech-to-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify({ audio, mimeType: blob.type || "audio/webm" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(data?.error ?? `Transcription failed (${res.status}).`);
  return String(data.text ?? "").trim();
}

/** Requests MP3 speech for the given text and returns a playable object URL. */
export async function synthesizeSpeech(text: string, accessToken?: string | null): Promise<string> {
  const res = await fetch(`${FUNCTIONS_BASE}/text-to-speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `Speech generation failed (${res.status}).`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
