import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trophy, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Attempt = Tables<"test_attempts">;

export default function StudentResults() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<(Attempt & { test_title: string })[]>([]);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [attRes, testRes] = await Promise.all([
        supabase.from("test_attempts").select("*").eq("student_id", user.id).order("created_at", { ascending: false }),
        supabase.from("tests").select("id, title"),
      ]);
      const testMap = new Map((testRes.data ?? []).map((t) => [t.id, t.title]));
      setAttempts(
        (attRes.data ?? []).map((a) => ({ ...a, test_title: testMap.get(a.test_id) ?? "Unknown Test" }))
      );
    };
    load();
  }, [user]);

  const generateFeedback = async (attempt: Attempt & { test_title: string }) => {
    setGeneratingFor(attempt.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-feedback", {
        body: {
          testTitle: attempt.test_title,
          totalScore: attempt.total_score,
          passed: attempt.passed,
          scores: attempt.scores as Record<string, number>,
        },
      });
      if (error) throw error;
      const feedback = data?.feedback || "Unable to generate feedback.";

      await supabase.from("test_attempts").update({ feedback } as Record<string, unknown>).eq("id", attempt.id);

      setAttempts((prev) => prev.map((a) => a.id === attempt.id ? { ...a, feedback } : a));
    } catch {
      // silently fail
    }
    setGeneratingFor(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Results</h1>
        <p className="text-muted-foreground">View your test scores and AI-powered feedback</p>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No test results yet. Take a test to see your scores here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((a) => {
            const scores = (a.scores as Record<string, number>) ?? {};
            return (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {a.test_title}
                    </CardTitle>
                    <Badge variant={a.passed ? "default" : "destructive"}>
                      {a.passed ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold">{a.total_score ?? 0}%</span>
                      <p className="text-xs text-muted-foreground">
                        Attempt #{a.attempt_number} · {a.completed_at ? format(new Date(a.completed_at), "MMM d, yyyy h:mm a") : "—"}
                      </p>
                    </div>
                  </div>

                  {Object.keys(scores).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Subject Breakdown
                      </h4>
                      {Object.entries(scores).map(([subject, score]) => (
                        <div key={subject} className="flex items-center justify-between">
                          <span className="text-sm">{subject}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={score} className="h-2 w-32" />
                            <span className="text-sm font-medium w-10 text-right">{score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {a.feedback ? (
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-medium">AI Feedback</h4>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{a.feedback}</p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateFeedback(a)}
                      disabled={generatingFor === a.id}
                    >
                      {generatingFor === a.id ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Get AI Feedback</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
