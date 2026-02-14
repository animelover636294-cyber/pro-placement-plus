import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";

const CHART_COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(270, 70%, 50%)",
];

export default function AdminAnalytics() {
  const [passFailData, setPassFailData] = useState<{ name: string; value: number }[]>([]);
  const [subjectData, setSubjectData] = useState<{ subject: string; avgScore: number }[]>([]);
  const [companyData, setCompanyData] = useState<{ name: string; passed: number; failed: number }[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Pass/Fail pie
      const { data: attempts } = await supabase.from("test_attempts").select("passed, scores, test_id");
      const allAttempts = attempts ?? [];
      const passed = allAttempts.filter((a) => a.passed).length;
      const failed = allAttempts.length - passed;
      setPassFailData([
        { name: "Passed", value: passed },
        { name: "Failed", value: failed },
      ]);

      // Subject-wise scores from scores JSON
      const subjectMap: Record<string, { total: number; count: number }> = {};
      allAttempts.forEach((a) => {
        const scores = a.scores as Record<string, number> | null;
        if (scores) {
          Object.entries(scores).forEach(([subject, score]) => {
            if (!subjectMap[subject]) subjectMap[subject] = { total: 0, count: 0 };
            subjectMap[subject].total += score;
            subjectMap[subject].count += 1;
          });
        }
      });
      setSubjectData(
        Object.entries(subjectMap).map(([subject, { total, count }]) => ({
          subject,
          avgScore: Math.round(total / count),
        }))
      );

      // Company-wise stats
      const { data: tests } = await supabase.from("tests").select("id, title, company_id");
      const { data: companies } = await supabase.from("companies").select("id, name");
      const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]));
      const testCompanyMap = new Map((tests ?? []).map((t) => [t.id, t.company_id]));

      const compStats: Record<string, { passed: number; failed: number }> = {};
      allAttempts.forEach((a) => {
        const companyId = testCompanyMap.get(a.test_id);
        const name = companyId ? companyMap.get(companyId) ?? "Unlinked" : "Unlinked";
        if (!compStats[name]) compStats[name] = { passed: 0, failed: 0 };
        if (a.passed) compStats[name].passed++;
        else compStats[name].failed++;
      });
      setCompanyData(Object.entries(compStats).map(([name, v]) => ({ name, ...v })));
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">College placement analytics and insights</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Pass / Fail Ratio</CardTitle></CardHeader>
          <CardContent className="h-64">
            {passFailData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={passFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {passFailData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Subject-wise Avg Score</CardTitle></CardHeader>
          <CardContent className="h-64">
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Company-wise Results</CardTitle></CardHeader>
          <CardContent className="h-64">
            {companyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="passed" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
