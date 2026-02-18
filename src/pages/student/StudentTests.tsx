import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, AlertTriangle, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Loader2, Sparkles, Eye } from "lucide-react";
import { isPast, differenceInSeconds, format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Test = Tables<"tests">;

interface Question {
  id: string;
  type: "mcq" | "coding";
  subject: string;
  topic: string;
  text: string;
  options?: string[];
  correct_answer: string;
  points: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Review component showing wrong answers with explanations
function TestReview({ questions, answers, explanations, loadingExplanations, onClose }: {
  questions: Question[];
  answers: Record<string, string>;
  explanations: Record<string, { why_wrong: string; why_right: string }>;
  loadingExplanations: boolean;
  onClose: () => void;
}) {
  const wrongQuestions = questions.filter((q) => {
    const userAnswer = (answers[q.id] ?? "").trim().toLowerCase();
    const correct = q.correct_answer.trim().toLowerCase();
    return userAnswer !== correct;
  });

  const correctQuestions = questions.filter((q) => {
    const userAnswer = (answers[q.id] ?? "").trim().toLowerCase();
    const correct = q.correct_answer.trim().toLowerCase();
    return userAnswer === correct;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-auto">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h2 className="font-semibold text-lg">Test Review</h2>
        <Button variant="outline" onClick={onClose}>Close Review</Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Summary */}
          <div className="flex gap-4">
            <Card className="flex-1">
              <CardContent className="py-4 text-center">
                <CheckCircle2 className="mx-auto h-6 w-6 text-green-500 mb-1" />
                <p className="text-2xl font-bold text-green-600">{correctQuestions.length}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="py-4 text-center">
                <XCircle className="mx-auto h-6 w-6 text-destructive mb-1" />
                <p className="text-2xl font-bold text-destructive">{wrongQuestions.length}</p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </CardContent>
            </Card>
          </div>

          {wrongQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
                <p className="font-medium">Perfect score! All answers were correct.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-destructive">Incorrect Answers ({wrongQuestions.length})</h3>
              {wrongQuestions.map((q, idx) => {
                const userAnswer = answers[q.id] ?? "Not answered";
                const explanation = explanations[q.id];
                const optionLabel = (letter: string) => {
                  if (q.options) {
                    const i = letter.charCodeAt(0) - 65;
                    return q.options[i] ? `${letter}. ${q.options[i]}` : letter;
                  }
                  return letter;
                };

                return (
                  <Card key={q.id} className="border-destructive/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Q{idx + 1}</Badge>
                        <Badge variant="secondary">{q.subject}</Badge>
                        {q.topic && <Badge variant="secondary">{q.topic}</Badge>}
                      </div>
                      <p className="font-medium mt-2">{q.text}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
                        <p className="text-xs font-medium text-destructive mb-1">Your Answer:</p>
                        <p className="text-sm">{optionLabel(userAnswer)}</p>
                      </div>
                      <div className="rounded-md border border-green-500/50 bg-green-500/5 p-3">
                        <p className="text-xs font-medium text-green-600 mb-1">Correct Answer:</p>
                        <p className="text-sm">{optionLabel(q.correct_answer)}</p>
                      </div>

                      {loadingExplanations ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Generating explanation…
                        </div>
                      ) : explanation ? (
                        <div className="space-y-2">
                          <div className="rounded-md bg-muted p-3">
                            <p className="text-xs font-medium text-destructive mb-1">Why your answer is wrong:</p>
                            <p className="text-sm text-muted-foreground">{explanation.why_wrong}</p>
                          </div>
                          <div className="rounded-md bg-muted p-3">
                            <p className="text-xs font-medium text-green-600 mb-1">Why the correct answer is right:</p>
                            <p className="text-sm text-muted-foreground">{explanation.why_right}</p>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}

          {correctQuestions.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-green-600">Correct Answers ({correctQuestions.length})</h3>
              {correctQuestions.map((q, idx) => (
                <Card key={q.id} className="border-green-500/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Q{idx + 1}</Badge>
                      <Badge variant="secondary">{q.subject}</Badge>
                      <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                    <p className="font-medium mt-2">{q.text}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-green-500/50 bg-green-500/5 p-3">
                      <p className="text-xs font-medium text-green-600 mb-1">Your Answer (Correct):</p>
                      <p className="text-sm">
                        {q.options ? `${answers[q.id]}. ${q.options[answers[q.id]?.charCodeAt(0) - 65] ?? ""}` : answers[q.id]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentTests() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [profileCompletion, setProfileCompletion] = useState(0);

  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean; scores: Record<string, number> } | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittingRef = useRef(false);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, { why_wrong: string; why_right: string }>>({});
  const [loadingExplanations, setLoadingExplanations] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [testsRes, attemptsRes, profileRes] = await Promise.all([
      supabase.from("tests").select("*").order("scheduled_date", { ascending: true }),
      supabase.from("test_attempts").select("test_id, attempt_number").eq("student_id", user.id),
      supabase.from("profiles").select("profile_completion_percentage").eq("id", user.id).single(),
    ]);

    setTests(testsRes.data ?? []);
    setProfileCompletion(profileRes.data?.profile_completion_percentage ?? 0);

    const counts: Record<string, number> = {};
    (attemptsRes.data ?? []).forEach((a) => {
      counts[a.test_id] = Math.max(counts[a.test_id] ?? 0, a.attempt_number);
    });
    setAttemptCounts(counts);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!activeTest || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTest, submitted]);

  const startTest = (test: Test) => {
    const bank = (test.question_bank as unknown as Question[]) ?? [];
    if (bank.length === 0) { toast.error("This test has no questions"); return; }
    const count = test.questions_per_student ?? bank.length;
    const selected = shuffle(bank).slice(0, count);
    setQuestions(selected);
    setAnswers({});
    setCurrentIdx(0);
    setTimeLeft(test.duration * 60);
    setSubmitted(false);
    setResult(null);
    setAiFeedback(null);
    setShowReview(false);
    setExplanations({});
    setActiveTest(test);
    submittingRef.current = false;
  };

  const generateExplanations = async (qs: Question[], ans: Record<string, string>) => {
    const wrongQs = qs.filter((q) => {
      const userAnswer = (ans[q.id] ?? "").trim().toLowerCase();
      return userAnswer !== q.correct_answer.trim().toLowerCase();
    });

    if (wrongQs.length === 0) return;
    setLoadingExplanations(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-feedback", {
        body: {
          mode: "explanations",
          questions: wrongQs.map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correct_answer: q.correct_answer,
            user_answer: ans[q.id] ?? "Not answered",
            subject: q.subject,
          })),
        },
      });
      if (error) throw error;
      if (data?.explanations) {
        setExplanations(data.explanations);
      }
    } catch {
      // silently fail
    }
    setLoadingExplanations(false);
  };

  const generateFeedback = async (testTitle: string, totalScore: number, passed: boolean, scores: Record<string, number>) => {
    setLoadingFeedback(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-feedback", {
        body: { testTitle, totalScore, passed, scores },
      });
      if (error) throw error;
      const feedback = data?.feedback || "Unable to generate feedback.";
      setAiFeedback(feedback);

      if (user && activeTest) {
        await supabase.from("test_attempts")
          .update({ feedback } as Record<string, unknown>)
          .eq("student_id", user.id)
          .eq("test_id", activeTest.id)
          .order("created_at", { ascending: false })
          .limit(1);
      }
    } catch {
      setAiFeedback("Could not generate AI feedback at this time.");
    }
    setLoadingFeedback(false);
  };

  const handleSubmit = async () => {
    if (submittingRef.current || !activeTest || !user) return;
    submittingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    let totalScore = 0;
    let totalPoints = 0;
    const subjectScores: Record<string, { earned: number; total: number }> = {};

    questions.forEach((q) => {
      totalPoints += q.points;
      if (!subjectScores[q.subject]) subjectScores[q.subject] = { earned: 0, total: 0 };
      subjectScores[q.subject].total += q.points;

      const userAnswer = (answers[q.id] ?? "").trim().toLowerCase();
      const correct = q.correct_answer.trim().toLowerCase();
      if (userAnswer === correct) {
        totalScore += q.points;
        subjectScores[q.subject].earned += q.points;
      }
    });

    const scorePercent = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
    const criteria = (activeTest.pass_criteria as Record<string, number>) ?? {};
    const minPass = criteria.min_score_percent ?? 50;
    const passed = scorePercent >= minPass;

    const scoresMap: Record<string, number> = {};
    Object.entries(subjectScores).forEach(([sub, { earned, total }]) => {
      scoresMap[sub] = total > 0 ? Math.round((earned / total) * 100) : 0;
    });

    const attemptNum = (attemptCounts[activeTest.id] ?? 0) + 1;

    const { error } = await supabase.from("test_attempts").insert({
      student_id: user.id,
      test_id: activeTest.id,
      answers: JSON.parse(JSON.stringify(answers)),
      scores: JSON.parse(JSON.stringify(scoresMap)),
      total_score: scorePercent,
      passed,
      attempt_number: attemptNum,
      started_at: new Date(Date.now() - activeTest.duration * 60 * 1000).toISOString(),
      completed_at: new Date().toISOString(),
    });

    if (error) {
      toast.error("Failed to submit: " + error.message);
      submittingRef.current = false;
      return;
    }

    setResult({ score: scorePercent, total: totalPoints, passed, scores: scoresMap });
    setSubmitted(true);
    fetchData();

    // Generate AI feedback and explanations in parallel
    generateFeedback(activeTest.title, scorePercent, passed, scoresMap);
    generateExplanations(questions, answers);
  };

  const exitTest = () => {
    setActiveTest(null);
    setSubmitted(false);
    setResult(null);
    setAiFeedback(null);
    setShowReview(false);
    setExplanations({});
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (activeTest) {
    // Show review screen
    if (showReview) {
      return (
        <TestReview
          questions={questions}
          answers={answers}
          explanations={explanations}
          loadingExplanations={loadingExplanations}
          onClose={() => setShowReview(false)}
        />
      );
    }

    if (submitted && result) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6 overflow-auto">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              {result.passed ? (
                <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
              ) : (
                <XCircle className="mx-auto h-16 w-16 text-destructive" />
              )}
              <CardTitle className="mt-4 text-2xl">
                {result.passed ? "Congratulations! You Passed!" : "Test Not Passed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <span className="text-5xl font-bold">{result.score}%</span>
                <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
              </div>
              {Object.keys(result.scores).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Subject-wise Scores</h4>
                  {Object.entries(result.scores).map(([subject, score]) => (
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

              {/* AI Feedback */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">AI Feedback</h4>
                </div>
                {loadingFeedback ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating personalized feedback…
                  </div>
                ) : aiFeedback ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{aiFeedback}</p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowReview(true)} className="flex-1">
                  <Eye className="mr-2 h-4 w-4" /> Review Answers
                </Button>
                <Button onClick={exitTest} className="flex-1">Back to Tests</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const q = questions[currentIdx];
    const isLowTime = timeLeft < 60;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <h2 className="font-semibold">{activeTest.title}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{currentIdx + 1} / {questions.length}</span>
            <Badge variant={isLowTime ? "destructive" : "secondary"} className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(timeLeft)}
            </Badge>
          </div>
        </div>
        <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1 rounded-none" />
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{q.type.toUpperCase()}</Badge>
                <Badge variant="secondary">{q.subject}</Badge>
                {q.topic && <Badge variant="secondary">{q.topic}</Badge>}
                <span className="ml-auto text-sm text-muted-foreground">{q.points} pt{q.points > 1 ? "s" : ""}</span>
              </div>
              <p className="text-lg font-medium">{q.text}</p>
            </div>
            {q.type === "mcq" && q.options ? (
              <RadioGroup value={answers[q.id] ?? ""} onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })} className="space-y-3">
                {q.options.map((opt, i) => (
                  <div key={i} className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value={String.fromCharCode(65 + i)} id={`opt-${i}`} />
                    <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">
                      <span className="mr-2 font-medium text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                <Label>Your Answer</Label>
                <Textarea value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="Type your answer here…" rows={6} className="font-mono" />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between border-t px-6 py-3">
          <Button variant="outline" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <div className="flex gap-2">
            {currentIdx < questions.length - 1 ? (
              <Button onClick={() => setCurrentIdx(currentIdx + 1)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button onClick={handleSubmit} variant="default">Submit Test</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const eligible = profileCompletion >= 80;
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tests</h1>
        <p className="text-muted-foreground">View and take scheduled tests</p>
      </div>
      {!eligible && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm">Complete at least 80% of your profile to access tests. Currently at {profileCompletion}%.</p>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => {
          const attempts = attemptCounts[test.id] ?? 0;
          const maxAttempts = 2;
          const exhausted = attempts >= maxAttempts;
          const isUpcoming = !isPast(new Date(test.scheduled_date));
          const qCount = ((test.question_bank as unknown as Question[]) ?? []).length;
          const secsUntil = differenceInSeconds(new Date(test.scheduled_date), now);

          return (
            <Card key={test.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{test.title}</CardTitle>
                  {exhausted ? <Badge variant="secondary">Completed</Badge> : isUpcoming ? <Badge variant="outline">Upcoming</Badge> : <Badge>Available</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>Date (IST)</span><span className="text-right">{format(new Date(test.scheduled_date), "MMM d, yyyy h:mm a")}</span>
                  <span>Duration</span><span className="text-right">{test.duration} min</span>
                  <span>Questions</span><span className="text-right">{test.questions_per_student ?? qCount}</span>
                  <span>Attempts</span><span className="text-right">{attempts} / {maxAttempts}</span>
                </div>
                <Button className="w-full" disabled={!eligible || exhausted || isUpcoming} onClick={() => startTest(test)}>
                  {exhausted ? "Max Attempts Reached" : isUpcoming ? `Starts in ${Math.floor(secsUntil / 3600)}h ${Math.floor((secsUntil % 3600) / 60)}m` : !eligible ? "Profile Incomplete" : attempts > 0 ? "Retake Test" : "Start Test"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {tests.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-8 text-center text-muted-foreground">No tests available yet. Check back later.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
