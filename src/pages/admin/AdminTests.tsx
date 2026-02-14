import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Eye, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Test = Tables<"tests">;
type Company = Tables<"companies">;

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

interface PassCriteria {
  min_score_percent: number;
  min_per_subject?: Record<string, number>;
}

export default function AdminTests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);
  const [viewingTest, setViewingTest] = useState<Test | null>(null);
  const [attempts, setAttempts] = useState<Tables<"test_attempts">[]>([]);

  const [form, setForm] = useState({
    title: "",
    scheduled_date: "",
    duration: "60",
    max_participants: "100",
    company_id: "",
    questions_per_student: "25",
    min_score_percent: "60",
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [qForm, setQForm] = useState<Partial<Question>>({
    type: "mcq",
    subject: "",
    topic: "",
    text: "",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1,
  });

  const fetchTests = async () => {
    const { data } = await supabase.from("tests").select("*").order("scheduled_date", { ascending: false });
    setTests(data ?? []);
  };

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("*").order("name");
    setCompanies(data ?? []);
  };

  useEffect(() => {
    fetchTests();
    fetchCompanies();
  }, []);

  const resetForm = () => {
    setForm({ title: "", scheduled_date: "", duration: "60", max_participants: "100", company_id: "", questions_per_student: "25", min_score_percent: "60" });
    setQuestions([]);
    setEditing(null);
  };

  const addQuestion = () => {
    if (!qForm.text?.trim() || !qForm.subject?.trim()) {
      toast.error("Question text and subject are required");
      return;
    }
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: qForm.type as "mcq" | "coding",
      subject: qForm.subject!,
      topic: qForm.topic || "",
      text: qForm.text!,
      options: qForm.type === "mcq" ? (qForm.options || []).filter(Boolean) : undefined,
      correct_answer: qForm.correct_answer || "",
      points: qForm.points || 1,
    };
    setQuestions([...questions, newQ]);
    setQForm({ type: "mcq", subject: "", topic: "", text: "", options: ["", "", "", ""], correct_answer: "", points: 1 });
    toast.success("Question added");
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.scheduled_date) {
      toast.error("Title and scheduled date are required");
      return;
    }

    const passCriteria: PassCriteria = { min_score_percent: parseInt(form.min_score_percent) || 60 };

    const payload = {
      title: form.title,
      scheduled_date: form.scheduled_date,
      duration: parseInt(form.duration) || 60,
      max_participants: parseInt(form.max_participants) || null,
      company_id: form.company_id || null,
      questions_per_student: parseInt(form.questions_per_student) || 25,
      question_bank: JSON.parse(JSON.stringify(questions)),
      pass_criteria: JSON.parse(JSON.stringify(passCriteria)),
    };

    if (editing) {
      const { error } = await supabase.from("tests").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Test updated");
    } else {
      const { error } = await supabase.from("tests").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Test created");
    }
    setOpen(false);
    resetForm();
    fetchTests();
  };

  const handleEdit = (t: Test) => {
    const criteria = (t.pass_criteria as Record<string, number>) ?? {};
    setForm({
      title: t.title,
      scheduled_date: t.scheduled_date,
      duration: String(t.duration),
      max_participants: String(t.max_participants ?? ""),
      company_id: t.company_id ?? "",
      questions_per_student: String(t.questions_per_student ?? "25"),
      min_score_percent: String(criteria.min_score_percent ?? "60"),
    });
    setQuestions(((t.question_bank as unknown as Question[]) ?? []));
    setEditing(t);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tests").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Test deleted");
    fetchTests();
  };

  const handleViewResults = async (t: Test) => {
    setViewingTest(t);
    const { data } = await supabase.from("test_attempts").select("*").eq("test_id", t.id).order("total_score", { ascending: false });
    setAttempts(data ?? []);
  };

  const filtered = tests.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Management</h1>
          <p className="text-muted-foreground">Create and manage placement tests</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Test</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Test" : "Create Test"}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="questions" className="flex-1">Questions ({questions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Test Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. TCS Aptitude Round 1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Scheduled Date & Time</Label>
                    <Input type="datetime-local" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Participants</Label>
                    <Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Questions per Student</Label>
                    <Input type="number" value={form.questions_per_student} onChange={(e) => setForm({ ...form, questions_per_student: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company (optional)</Label>
                    <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pass Criteria (min %)</Label>
                    <Input type="number" value={form.min_score_percent} onChange={(e) => setForm({ ...form, min_score_percent: e.target.value })} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-4 pt-4">
                <Card>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={qForm.type} onValueChange={(v) => setQForm({ ...qForm, type: v as "mcq" | "coding" })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">MCQ</SelectItem>
                            <SelectItem value="coding">Coding</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input value={qForm.subject ?? ""} onChange={(e) => setQForm({ ...qForm, subject: e.target.value })} placeholder="e.g. Aptitude" />
                      </div>
                      <div className="space-y-2">
                        <Label>Topic</Label>
                        <Input value={qForm.topic ?? ""} onChange={(e) => setQForm({ ...qForm, topic: e.target.value })} placeholder="e.g. Percentages" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Textarea value={qForm.text ?? ""} onChange={(e) => setQForm({ ...qForm, text: e.target.value })} rows={2} />
                    </div>
                    {qForm.type === "mcq" && (
                      <div className="grid grid-cols-2 gap-3">
                        {(qForm.options || []).map((opt, i) => (
                          <div key={i} className="space-y-1">
                            <Label>Option {String.fromCharCode(65 + i)}</Label>
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const opts = [...(qForm.options || [])];
                                opts[i] = e.target.value;
                                setQForm({ ...qForm, options: opts });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Input value={qForm.correct_answer ?? ""} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })} placeholder={qForm.type === "mcq" ? "e.g. A" : "Expected output"} />
                      </div>
                      <div className="space-y-2">
                        <Label>Points</Label>
                        <Input type="number" value={qForm.points ?? 1} onChange={(e) => setQForm({ ...qForm, points: parseInt(e.target.value) || 1 })} />
                      </div>
                    </div>
                    <Button onClick={addQuestion} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Question</Button>
                  </CardContent>
                </Card>

                {questions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Added Questions ({questions.length})</h4>
                    {questions.map((q, i) => (
                      <div key={q.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                          <Badge variant="secondary">{q.type.toUpperCase()}</Badge>
                          <Badge variant="outline">{q.subject}</Badge>
                          <span className="truncate text-sm">{q.text}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            <Button onClick={handleSave} className="mt-4 w-full">{editing ? "Update Test" : "Create Test"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tests…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const qCount = ((t.question_bank as unknown as Question[]) ?? []).length;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{format(new Date(t.scheduled_date), "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell>{t.duration} min</TableCell>
                    <TableCell>{qCount} in bank / {t.questions_per_student ?? qCount} per student</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewResults(t)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No tests found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={!!viewingTest} onOpenChange={(v) => { if (!v) setViewingTest(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Results — {viewingTest?.title}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.student_id.slice(0, 8)}…</TableCell>
                  <TableCell>{a.attempt_number}</TableCell>
                  <TableCell>{a.total_score ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.passed ? "default" : "destructive"}>
                      {a.passed ? "Passed" : "Failed"}
                    </Badge>
                  </TableCell>
                  <TableCell>{a.completed_at ? format(new Date(a.completed_at), "MMM d, h:mm a") : "In progress"}</TableCell>
                </TableRow>
              ))}
              {attempts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No attempts yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
