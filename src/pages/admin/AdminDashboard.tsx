import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, ClipboardList, Building2, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, tests: 0, companies: 0, passRate: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [studentsRes, testsRes, companiesRes, attemptsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("tests").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("test_attempts").select("passed"),
      ]);

      const attempts = attemptsRes.data ?? [];
      const passed = attempts.filter((a) => a.passed).length;
      const passRate = attempts.length > 0 ? Math.round((passed / attempts.length) * 100) : 0;

      setStats({
        students: studentsRes.count ?? 0,
        tests: testsRes.count ?? 0,
        companies: companiesRes.count ?? 0,
        passRate,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Students", value: stats.students, icon: Users, color: "text-primary" },
    { title: "Tests Scheduled", value: stats.tests, icon: ClipboardList, color: "text-primary" },
    { title: "Companies", value: stats.companies, icon: Building2, color: "text-primary" },
    { title: "Pass Rate", value: `${stats.passRate}%`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your placement platform</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
