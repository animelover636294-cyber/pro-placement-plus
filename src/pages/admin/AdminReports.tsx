import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, FileText, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Test = Tables<"tests">;

interface ProctorEvent {
  timestamp: string;
  gadget: string;
  action: "warning" | "auto_submit";
}

interface ReportRow {
  attemptId: string;
  studentName: string;
  email: string;
  cgpa: number | null;
  totalScore: number | null;
  passed: boolean | null;
  attemptNumber: number;
  completedAt: string | null;
  resumeUrl: string | null;
  proctorEvents: ProctorEvent[];
  autoSubmitted: boolean;
  retakeReason: string | null;
}

export default function AdminReports() {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("tests").select("*").order("scheduled_date", { ascending: false }).then(({ data }) => setTests(data ?? []));
  }, []);

  const generateReport = async () => {
    if (!selectedTest) { toast.error("Select a test first"); return; }
    setLoading(true);

    const { data: attempts } = await supabase
      .from("test_attempts")
      .select("id, student_id, total_score, passed, attempt_number, completed_at")
      .eq("test_id", selectedTest)
      .order("total_score", { ascending: false });

    if (!attempts || attempts.length === 0) {
      setRows([]);
      setLoading(false);
      toast.info("No attempts found for this test");
      return;
    }

    const studentIds = [...new Set(attempts.map((a) => a.student_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email, cgpa, resume_url")
      .in("id", studentIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const reportRows: ReportRow[] = attempts.map((a) => {
      const p = profileMap.get(a.student_id);
      return {
        attemptId: a.id,
        studentName: p?.name || "Unknown",
        email: p?.email || "—",
        cgpa: p?.cgpa ?? null,
        totalScore: a.total_score,
        passed: a.passed,
        attemptNumber: a.attempt_number,
        completedAt: a.completed_at,
        resumeUrl: p?.resume_url ?? null,
      };
    });

    setRows(reportRows);
    setLoading(false);
  };

  const deleteAttempt = async (attemptId: string) => {
    const { error } = await supabase.from("test_attempts").delete().eq("id", attemptId);
    if (error) { toast.error("Failed to delete: " + error.message); return; }
    setRows((prev) => prev.filter((r) => r.attemptId !== attemptId));
    toast.success("Record deleted");
  };

  const deleteAllForTest = async () => {
    if (!selectedTest) return;
    const { error } = await supabase.from("test_attempts").delete().eq("test_id", selectedTest);
    if (error) { toast.error("Failed to delete: " + error.message); return; }
    setRows([]);
    toast.success("All records for this test were deleted");
  };

  const downloadCSV = () => {
    if (rows.length === 0) { toast.error("No data to export"); return; }
    const test = tests.find((t) => t.id === selectedTest);
    const headers = ["Name", "Email", "CGPA", "Score", "Status", "Attempt", "Completed At", "Resume URL"];
    const csvRows = rows.map((r) => [
      r.studentName,
      r.email,
      r.cgpa ?? "",
      r.totalScore ?? "",
      r.passed ? "Passed" : "Failed",
      r.attemptNumber,
      r.completedAt ? format(new Date(r.completedAt), "yyyy-MM-dd HH:mm") : "",
      r.resumeUrl ?? "",
    ]);

    const csv = [headers.join(","), ...csvRows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${test?.title ?? "test"}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and download placement reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" /> Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger><SelectValue placeholder="Select a test" /></SelectTrigger>
                <SelectContent>
                  {tests.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title} — {format(new Date(t.scheduled_date), "MMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={loading}>
              {loading ? "Generating…" : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Results ({rows.length} students)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all records for this test?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes every attempt record for the selected test. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllForTest}>Delete All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CGPA</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.attemptId}>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.cgpa ?? "—"}</TableCell>
                    <TableCell>{r.totalScore ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.passed ? "default" : "destructive"}>
                        {r.passed ? "Passed" : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.attemptNumber}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Permanently delete {r.studentName}'s attempt #{r.attemptNumber}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAttempt(r.attemptId)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
