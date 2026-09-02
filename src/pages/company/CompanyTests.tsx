import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
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

const emptyForm = {
  title: "", scheduled_date: "", duration: "60", max_participants: "100",
  questions_per_student: "25", min_score_percent: "60",
  registration_opens_at: "", registration_closes_at: "",
};

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function CompanyTests() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [tests, setTests] = useState<Test[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const [qForm, setQForm] = useState<Partial<Question>>({ type: "mcq", subject: "", topic: "", text: "", options: ["", "", "", ""], correct_answer: "", points: 1 });
  const [aiSubject, setAiSubject] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [aiLoading, setAiLoading] = useState(false);

  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const loadCompany = async () => {
    if (!user) return;
    const { data } = await supabase.from("companies").select("id, name").eq("owner_user_id", user.id).maybeSingle();
    if (data) { setCompanyId(data.id); setCompanyName(data.name); }
  };

  const loadTests = async (cid: string) => {
    const { data } = await supabase.from("tests").select("*").eq("company_id", cid).order("scheduled_date", { ascending: false });
    setTests(data ?? []);
  };

  useEffect(() => { loadCompany(); /* eslint-disable-next-line */ }, [user?.id]);
  useEffect(() => { if (companyId) loadTests(companyId); }, [companyId]);

  const reset = () => { setForm({ ...emptyForm }); setQuestions([]); setEditing(null); };

  const startEdit = (t: Test) => {
    setEditing(t);
    setForm({
      title: t.title,
      scheduled_date: toLocal(t.scheduled_date),
      duration: String(t.duration),
      max_participants: String(t.max_participants ?? 100),
      questions_per_student: String(t.questions_per_student ?? 25),
      min_score_percent: String((t.pass_criteria as any)?.min_score_percent ?? (t.pass_criteria as any)?.pass_percentage ?? 60),
      registration_opens_at: toLocal(t.registration_opens_at),
      registration_closes_at: toLocal(t.registration_closes_at),
    });
    setQuestions(((t.question_bank as unknown) as Question[]) ?? []);
    setOpen(true);
  };

  const addQuestion = () => {
    if (!qForm.text?.trim() || !qForm.subject?.trim()) { toast.error("Question text and subject are required"); return; }
    setQuestions((prev) => [...prev, {
      id: crypto.randomUUID(),
      type: (qForm.type as "mcq" | "coding") ?? "mcq",
      subject: qForm.subject!, topic: qForm.topic ?? "", text: qForm.text!,
      options: qForm.type === "coding" ? undefined : (qForm.options ?? []).filter(Boolean),
      correct_answer: qForm.correct_answer ?? "", points: qForm.points ?? 1,
    }]);
    setQForm({ type: "mcq", subject: "", topic: "", text: "", options: ["", "", "", ""], correct_answer: "", points: 1 });
    toast.success("Question added");
  };

  const generateAI = async () => {
    if (!aiSubject.trim()) { toast.error("Subject is required"); return; }
    setAiLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-questions", {
      body: { subject: aiSubject, topic: aiTopic, count: parseInt(aiCount) || 5, type: "mcq" },
    });
    setAiLoading(false);
    if (error) { toast.error("Failed to generate questions"); return; }
    const generated = (data?.questions ?? []) as Question[];
    setQuestions((prev) => [...prev, ...generated]);
    toast.success(`${generated.length} questions generated`);
  };

  const save = async () => {
    if (!companyId) { toast.error("No company linked to your account"); return; }
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.scheduled_date) { toast.error("Schedule the assessment date and time"); return; }
    if (questions.length === 0) { toast.error("Add at least one question"); return; }
    const opens = form.registration_opens_at ? new Date(form.registration_opens_at) : null;
    const closes = form.registration_closes_at ? new Date(form.registration_closes_at) : null;
    if (opens && closes && closes <= opens) { toast.error("Registration must close after it opens"); return; }
    if (closes && closes > new Date(form.scheduled_date)) { toast.error("Registration must close before the assessment starts"); return; }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      scheduled_date: new Date(form.scheduled_date).toISOString(),
      duration: parseInt(form.duration) || 60,
      max_participants: parseInt(form.max_participants) || 100,
      questions_per_student: parseInt(form.questions_per_student) || questions.length,
      pass_criteria: { min_score_percent: parseInt(form.min_score_percent) || 60 },
      question_bank: questions as unknown as any,
      company_id: companyId,
      registration_opens_at: opens ? opens.toISOString() : null,
      registration_closes_at: closes ? closes.toISOString() : null,
    };

    if (editing) {
      const { error } = await supabase.from("tests").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Assessment updated");
    } else {
      const { data, error } = await supabase.from("tests").insert({ ...payload, created_by: user?.id ?? null }).select("id").single();
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Assessment created — students have been notified");
      supabase.functions.invoke("send-test-notification", {
        body: {
          testId: data.id,
          testTitle: `${companyName}: ${payload.title}`,
          scheduledDate: format(new Date(payload.scheduled_date), "MMM d, yyyy h:mm a"),
        },
      }).catch(() => {});
    }
    setOpen(false); reset(); loadTests(companyId);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("tests").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Assessment deleted");
    if (companyId) loadTests(companyId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">Create and schedule assessments for {companyName || "your company"}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New assessment</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader><DialogTitle>{editing ? "Edit assessment" : "New assessment"}</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6 pt-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={(e) => f("title", e.target.value)} placeholder="Graduate Engineer Aptitude Round" />
                  </div>
                  <div className="space-y-2">
                    <Label>Scheduled date &amp; time *</Label>
                    <Input type="datetime-local" value={form.scheduled_date} onChange={(e) => f("scheduled_date", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input type="number" value={form.duration} onChange={(e) => f("duration", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration opens</Label>
                    <Input type="datetime-local" value={form.registration_opens_at} onChange={(e) => f("registration_opens_at", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration closes</Label>
                    <Input type="datetime-local" value={form.registration_closes_at} onChange={(e) => f("registration_closes_at", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max participants</Label>
                    <Input type="number" value={form.max_participants} onChange={(e) => f("max_participants", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Questions per student</Label>
                    <Input type="number" value={form.questions_per_student} onChange={(e) => f("questions_per_student", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pass percentage</Label>
                    <Input type="number" value={form.min_score_percent} onChange={(e) => f("min_score_percent", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-border/50 p-4">
                  <h3 className="label-caps text-xs text-muted-foreground">Generate questions with AI</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input placeholder="Subject" value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} />
                    <Input placeholder="Topic (optional)" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
                    <Input type="number" placeholder="Count" value={aiCount} onChange={(e) => setAiCount(e.target.value)} />
                  </div>
                  <Button type="button" variant="secondary" onClick={generateAI} disabled={aiLoading}>
                    {aiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate</>}
                  </Button>
                </div>

                <div className="space-y-3 rounded-xl border border-border/50 p-4">
                  <h3 className="label-caps text-xs text-muted-foreground">Add a question manually</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={qForm.type} onValueChange={(v) => setQForm((p) => ({ ...p, type: v as "mcq" | "coding" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple choice</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Subject" value={qForm.subject ?? ""} onChange={(e) => setQForm((p) => ({ ...p, subject: e.target.value }))} />
                    <div className="sm:col-span-2">
                      <Textarea rows={2} placeholder="Question text" value={qForm.text ?? ""} onChange={(e) => setQForm((p) => ({ ...p, text: e.target.value }))} />
                    </div>
                    {qForm.type === "mcq" && (qForm.options ?? ["", "", "", ""]).map((opt, i) => (
                      <Input key={i} placeholder={`Option ${i + 1}`} value={opt}
                        onChange={(e) => setQForm((p) => {
                          const options = [...(p.options ?? ["", "", "", ""])];
                          options[i] = e.target.value;
                          return { ...p, options };
                        })} />
                    ))}
                    <Input placeholder="Correct answer" value={qForm.correct_answer ?? ""} onChange={(e) => setQForm((p) => ({ ...p, correct_answer: e.target.value }))} />
                    <Input type="number" placeholder="Points" value={qForm.points ?? 1} onChange={(e) => setQForm((p) => ({ ...p, points: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <Button type="button" variant="secondary" onClick={addQuestion}><Plus className="mr-2 h-4 w-4" /> Add question</Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="label-caps text-xs text-muted-foreground">Question bank</h3>
                    <Badge variant="outline">{questions.length} questions</Badge>
                  </div>
                  {questions.map((q, i) => (
                    <div key={q.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/40 p-3 text-sm">
                      <span><span className="text-muted-foreground">{i + 1}.</span> {q.text}</span>
                      <Button size="icon" variant="ghost" onClick={() => setQuestions((p) => p.filter((x) => x.id !== q.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button className="w-full font-bold" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : editing ? "Update assessment" : "Create assessment"}
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Registration window</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No assessments yet.</TableCell></TableRow>
              )}
              {tests.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{format(new Date(t.scheduled_date), "MMM d, yyyy h:mm a")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.registration_opens_at ? format(new Date(t.registration_opens_at), "MMM d, h:mm a") : "Open now"}
                    {" → "}
                    {t.registration_closes_at ? format(new Date(t.registration_closes_at), "MMM d, h:mm a") : "No deadline"}
                  </TableCell>
                  <TableCell>{(((t.question_bank as unknown) as Question[]) ?? []).length}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
