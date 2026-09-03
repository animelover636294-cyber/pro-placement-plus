import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { streamAssistant } from "@/lib/assistantStream";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Bot, Loader2, Mic, Send, Square, User, Volume2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Message { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Which company has the highest pass rate?",
  "List the 5 lowest scoring students this month.",
  "How many students registered for each upcoming assessment?",
  "Summarise proctoring violations across all attempts.",
];

export default function AdminAssistant() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const voice = useVoiceChat(accessToken);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isStreaming]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || isStreaming) return;
    setInput("");
    const history: Message[] = [...messages, { role: "user", content: question }];
    setMessages(history);
    setIsStreaming(true);

    let content = "";
    try {
      await streamAssistant({
        fn: "admin-assistant",
        messages: history,
        accessToken,
        onDelta: (chunk) => {
          content += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") return [...prev.slice(0, -1), { role: "assistant", content }];
            return [...prev, { role: "assistant", content }];
          });
        },
      });
    } catch (err) {
      toast.error((err as Error).message);
      setMessages(history);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleMic = async () => {
    if (voice.isRecording) {
      const text = await voice.stopRecording();
      if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
    } else {
      await voice.startRecording();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Assistant</h1>
          <p className="text-muted-foreground">Ask anything about students, companies, assessments and results.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={() => { setMessages([]); voice.stopSpeaking(); }}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear chat
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex h-[calc(100vh-19rem)] flex-col p-0">
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
                <Bot className="mx-auto h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">
                  This assistant has read access to the full platform database. Try one of these:
                </p>
                <div className="grid gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="outline" className="justify-start text-left" onClick={() => send(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex items-start gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
                      {m.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-secondary/60"
                    )}>
                      {m.role === "assistant" ? (
                        <>
                          <div className="prose prose-invert max-w-none text-sm"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                          <Button
                            size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs text-muted-foreground"
                            onClick={() => voice.speak(`admin-${i}`, m.content)}
                          >
                            {voice.speakingId === `admin-${i}`
                              ? <><Square className="mr-1 h-3 w-3" /> Stop</>
                              : <><Volume2 className="mr-1 h-3 w-3" /> Listen</>}
                          </Button>
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Analysing platform data…
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-border/40 p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-3 py-2">
              <Button
                size="icon" variant={voice.isRecording ? "destructive" : "ghost"}
                className="shrink-0 rounded-xl" onClick={handleMic} disabled={voice.isTranscribing || isStreaming}
                aria-label={voice.isRecording ? "Stop recording" : "Start voice input"}
              >
                {voice.isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" />
                  : voice.isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask about any student, company or assessment…"
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                disabled={isStreaming}
              />
              <Button size="icon" className="shrink-0 rounded-xl" onClick={() => send(input)} disabled={!input.trim() || isStreaming}>
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Admin-only. Answers are grounded in live platform data.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
