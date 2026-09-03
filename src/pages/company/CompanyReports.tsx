import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Row {
  id: string;
  testId: string;
  testTitle: string;
  studentName: string;
  studentEmail: string;
  score: number;
  passed: boolean;
  autoSubmitted: boolean;
  attemptNumber: number;
  completedAt: string | null;
}

export default function CompanyReports() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [tests, setTests] = useState<{ id: string; title: string }[]>([]);
  const [testFilter, setTestFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: company } = await supabase
        .from("companies").select("id").eq("owner_user_id", user.id).maybeSingle();
      if (!company) { setLoading(false); return; }

      const { data: testRows } = await supabase
        .from("tests").select("id, title").eq("company_id", company.id).order("scheduled_date", { ascending: false });
      const list = testRows ?? [];
      setTests(list);

      if (list.length === 0) { setLoading(false); return; }

      const { data: attempts, error } = await supabase
        .from("test_attempts")
        .select("id, test_id, student_id, total_score, passed, auto_submitted, attempt_number, completed_at")
        .in("test_id", list.map((t) => t.id))
        .order("completed_at", { ascending: false });
      if (error) { toast.error("Could not load your reports"); setLoading(false); return; }

      const studentIds = [...new Set((attempts ?? []).map((a) => a.student_id))];
      const { data: profiles } = studentIds.length
        ? await supabase.from("profiles").select("id, name, email").in("id", studentIds)
        : { data: [] as { id: string; name: string | null; email: string | null }[] };
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

      setRows((attempts ?? []).map((a) => ({
        id: a.id,
        testId: a.test_id,
        testTitle: list.find((t) => t.id === a.test_id)?.title ?? "—",
        studentName: byId.get(a.student_id)?.name ?? "Unknown",
        studentEmail: byId.get(a.student_id)?.email ?? "—",
        score: Number(a.total_score ?? 0),
        passed: !!a.passed,
        autoSubmitted: !!a.auto_submitted,
        attemptNumber: a.attempt_number,
        completedAt: a.completed_at,
      })));
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => rows.filter((r) =>
    (testFilter === "all" || r.testId === testFilter) &&
    (statusFilter === "all" || (statusFilter === "passed" ? r.passed : !r.passed))
  ), [rows, testFilter, statusFilter]);

  const exportCsv = () => {
    if (filtered.length === 0) { toast.error("Nothing to export"); return; }
    const header = ["Assessment", "Student", "Email", "Score", "Result", "Attempt", "Auto submitted", "Completed"];
    const body = filtered.map((r) => [
      r.testTitle, r.studentName, r.studentEmail, r.score, r.passed ? "Passed" : "Failed",
      r.attemptNumber, r.autoSubmitted ? "Yes" : "No",
      r.completedAt ? format(new Date(r.completedAt), "yyyy-MM-dd HH:mm") : "—",
    ]);
    const csv = [header, ...body].map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading reports…</div>;
  }

  const passRate = filtered.length ? Math.round((filtered.filter((r) => r.passed).length / filtered.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Results for assessments your company created</p>
        </div>
        <Button onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Attempts", value: filtered.length },
          { label: "Passed", value: filtered.filter((r) => r.passed).length },
          { label: "Pass rate", value: `${passRate}%` },
        ].map((c) => (
          <Card key={c.label}><CardContent className="py-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={testFilter} onValueChange={setTestFilter}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Assessment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assessments</SelectItem>
                {tests.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Result" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All results</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.studentName}</div>
                    <div className="text-xs text-muted-foreground">{r.studentEmail}</div>
                  </TableCell>
                  <TableCell>{r.testTitle}</TableCell>
                  <TableCell>{r.score}</TableCell>
                  <TableCell>
                    <Badge variant={r.passed ? "default" : "secondary"}>{r.passed ? "Passed" : "Failed"}</Badge>
                    {r.autoSubmitted && <Badge variant="outline" className="ml-1 text-xs">Auto</Badge>}
                  </TableCell>
                  <TableCell>{r.attemptNumber}</TableCell>
                  <TableCell>{r.completedAt ? format(new Date(r.completedAt), "MMM d, yyyy h:mm a") : "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No attempts yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
