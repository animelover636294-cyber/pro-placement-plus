export type AssistantMessage = { role: "user" | "assistant"; content: string };

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface StreamOptions {
  fn: "student-assistant" | "site-assistant";
  messages: AssistantMessage[];
  accessToken?: string | null;
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}

/**
 * Calls an assistant edge function and streams back plain-text deltas.
 * Returns the full assistant reply.
 */
export async function streamAssistant({ fn, messages, accessToken, signal, onDelta }: StreamOptions) {
  const res = await fetch(`${FUNCTIONS_BASE}/${fn}`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok || !res.body) {
    let message = `Assistant unavailable (${res.status}).`;
    try {
      const data = await res.json();
      if (data?.error) message = typeof data.error === "string" ? data.error : message;
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onDelta(chunk);
    }
  }
  return full;
}

export function deriveThreadTitle(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean;
}
