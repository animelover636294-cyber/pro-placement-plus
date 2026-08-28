import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { streamAssistant } from "@/lib/assistantStream";
import { toast } from "sonner";
import { Bot, MessageCircle, Send, X, User, Loader2 } from "lucide-react";
import assistantMark from "@/assets/assistant-mark.png";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "ipms-site-assistant-history";

export function SiteChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load browser-only history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* ignore parse errors */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setIsStreaming(true);

    let reply = "";
    try {
      await streamAssistant({
        fn: "site-assistant",
        messages: nextMessages,
        accessToken: null,
        signal: undefined,
        onDelta: (chunk) => {
          reply += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return [...prev.slice(0, -1), { ...last, content: reply }];
            }
            return [...prev, { role: "assistant", content: reply }];
          });
        },
      });
    } catch (err: any) {
      toast.error(err?.message || "Assistant failed to respond.");
      setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && !m.content)));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl backdrop-blur-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 bg-primary/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={assistantMark} alt="IPMS Assistant" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">IPMS Guide</h3>
                  <p className="text-xs text-muted-foreground">Ask about the platform</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearHistory}>
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Bot className="h-8 w-8 text-primary" />
                  <p className="px-4 text-sm">
                    Hi! I can tell you what the Intelligent Placement Management System does, how students and
                    admins use it, and answer questions about features and technology.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start gap-2",
                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className="h-7 w-7 border border-border">
                        {m.role === "assistant" ? (
                          <>
                            <AvatarImage src={assistantMark} alt="Assistant" />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback className="bg-secondary text-foreground">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-secondary/60 text-foreground"
                        )}
                      >
                        {m.role === "assistant" ? (
                          <div className="prose prose-invert max-w-none text-xs">
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
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border/40 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question…"
                  className="h-8 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                  disabled={isStreaming}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-lg"
                >
                  {isStreaming ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
              </div>
              <p className="mt-1 text-center text-[10px] text-muted-foreground">
                History is stored only in this browser.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.45)] transition-transform"
        aria-label="Open site assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
