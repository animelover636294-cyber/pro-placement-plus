import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { streamAssistant, deriveThreadTitle } from "@/lib/assistantStream";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Check,
  X,
} from "lucide-react";
import assistantMark from "@/assets/assistant-mark.png";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Thread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export default function StudentAssistant() {
  const { user, session, loading: authLoading } = useAuth();
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accessToken = session?.access_token ?? null;

  // Fetch all threads for sidebar
  useEffect(() => {
    if (!user) return;
    const loadThreads = async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) {
        toast.error("Failed to load conversations.");
        return;
      }
      setThreads(data ?? []);
    };
    loadThreads();
  }, [user]);

  // Fetch messages when threadId changes
  useEffect(() => {
    if (!user || !threadId) {
      setMessages([]);
      return;
    }
    setIsLoadingThread(true);
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("thread_id", threadId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) {
        toast.error("Failed to load messages.");
        setMessages([]);
      } else {
        setMessages(
          (data ?? []).map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            created_at: m.created_at,
          }))
        );
      }
      setIsLoadingThread(false);
    };
    loadMessages();
  }, [user, threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleNewChat = () => {
    navigate("/dashboard/assistant", { replace: true });
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDeleteThread = async (id: string) => {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id).eq("user_id", user!.id);
    if (error) {
      toast.error("Failed to delete conversation.");
      return;
    }
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (threadId === id) handleNewChat();
    toast.success("Conversation deleted.");
  };

  const startRename = (t: Thread) => {
    setRenameId(t.id);
    setRenameValue(t.title);
  };

  const saveRename = async () => {
    if (!renameId || !renameValue.trim()) {
      setRenameId(null);
      return;
    }
    const { error } = await supabase
      .from("chat_threads")
      .update({ title: renameValue.trim() })
      .eq("id", renameId)
      .eq("user_id", user!.id);
    if (error) {
      toast.error("Failed to rename conversation.");
    } else {
      setThreads((prev) =>
        prev.map((t) => (t.id === renameId ? { ...t, title: renameValue.trim() } : t))
      );
      toast.success("Conversation renamed.");
    }
    setRenameId(null);
    setRenameValue("");
  };

  const handleSend = async () => {
    if (!user || !input.trim() || isLoading || isStreaming) return;

    const text = input.trim();
    setInput("");
    setIsLoading(true);

    let currentThreadId = threadId;
    let isNewThread = false;

    // Create a new thread if none exists
    if (!currentThreadId) {
      isNewThread = true;
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({ user_id: user.id, title: "New chat" })
        .select("id")
        .single();
      if (error || !data) {
        toast.error("Failed to start conversation.");
        setIsLoading(false);
        return;
      }
      currentThreadId = data.id;
      navigate(`/dashboard/assistant/${currentThreadId}`, { replace: true });
      setThreads((prev) => [
        { id: data.id, title: "New chat", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ...prev,
      ]);
    }

    // Persist user message
    const { data: userMsg, error: insertErr } = await supabase
      .from("chat_messages")
      .insert({ thread_id: currentThreadId, user_id: user.id, role: "user", content: text })
      .select("id, role, content, created_at")
      .single();
    if (insertErr) {
      toast.error("Failed to save message.");
      setIsLoading(false);
      return;
    }

    const nextMessages: Message[] = [
      ...messages,
      { id: userMsg.id, role: "user", content: userMsg.content, created_at: userMsg.created_at },
    ];
    setMessages(nextMessages);
    setIsLoading(false);
    setIsStreaming(true);

    // Build history for assistant edge function
    const history = nextMessages.map((m) => ({ role: m.role, content: m.content }));

    let assistantContent = "";
    try {
      await streamAssistant({
        fn: "student-assistant",
        messages: history,
        accessToken,
        signal: undefined,
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const existing = prev.find((m) => m.role === "assistant" && !m.id);
            if (existing) {
              return prev.map((m) => (m === existing ? { ...m, content: assistantContent } : m));
            }
            return [...prev, { role: "assistant", content: assistantContent }];
          });
        },
      });

      // Persist assistant message
      const { error: assistantInsertErr } = await supabase
        .from("chat_messages")
        .insert({
          thread_id: currentThreadId,
          user_id: user.id,
          role: "assistant",
          content: assistantContent,
        });
      if (assistantInsertErr) {
        toast.error("Failed to save assistant reply.");
      }

      // Update thread title on first assistant response
      if (isNewThread && assistantContent) {
        const title = deriveThreadTitle(text || assistantContent);
        await supabase.from("chat_threads").update({ title }).eq("id", currentThreadId).eq("user_id", user.id);
        setThreads((prev) => prev.map((t) => (t.id === currentThreadId ? { ...t, title } : t)));
      }
    } catch (err: any) {
      toast.error(err?.message || "Assistant failed to respond.");
      setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && !m.id)));
    } finally {
      setIsStreaming(false);
      // Reload messages to get persisted IDs/order
      const { data: refreshed } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("thread_id", currentThreadId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (refreshed) {
        setMessages(
          refreshed.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            created_at: m.created_at,
          }))
        );
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-3xl">
      {/* Sidebar */}
      <div className="flex w-72 flex-col border-r border-border/40 bg-sidebar/40">
        <div className="p-4">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 font-semibold"
            variant="outline"
          >
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="flex flex-col gap-1 pb-4">
            {threads.length === 0 && (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                No conversations yet. Start a new chat to get personalised guidance.
              </div>
            )}
            {threads.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                  threadId === t.id
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                {renameId === t.id ? (
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename();
                      if (e.key === "Escape") setRenameId(null);
                    }}
                    onBlur={saveRename}
                    className="h-7 px-1 py-0 text-sm"
                  />
                ) : (
                  <button
                    onClick={() => navigate(`/dashboard/assistant/${t.id}`)}
                    className="flex-1 truncate text-left"
                  >
                    {t.title || "New chat"}
                  </button>
                )}
                {renameId !== t.id && (
                  <div className="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => startRename(t)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteThread(t.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={assistantMark} alt="Assistant" />
              <AvatarFallback className="bg-primary/20 text-primary">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-display text-sm font-semibold text-foreground">Student Assistant</h2>
              <p className="text-xs text-muted-foreground">Personalised guidance based on your data</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="font-display text-lg font-semibold text-foreground">How can I help you today?</h3>
                <p className="text-sm">
                  Ask about your assessment performance, upcoming schedules, eligibility for companies, or
                  get study recommendations. I can only see your own records.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((m, idx) => (
                <div
                  key={m.id ?? idx}
                  className={cn(
                    "flex items-start gap-3",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-8 w-8 border border-border">
                    {m.role === "assistant" ? (
                      <>
                        <AvatarImage src={assistantMark} alt="Assistant" />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-secondary text-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-secondary/60 text-foreground"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-invert max-w-none text-sm">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Assistant is typing…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          {isLoadingThread && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border/40 p-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-3 py-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your assessments, schedule, or eligibility…"
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={isLoading || isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isStreaming}
              size="icon"
              className="shrink-0 rounded-xl"
            >
              {isLoading || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Replies are based only on your profile, attempts and schedules.
          </p>
        </div>
      </div>
    </div>
  );
}
