import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Trophy, ClipboardList, UserCircle } from "lucide-react";
import { EligibilityChecker } from "@/components/EligibilityChecker";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string | null; profile_completion_percentage: number | null } | null>(null);
  const [upcomingTests, setUpcomingTests] = useState(0);
  const [completedTests, setCompletedTests] = useState(0);
  const [passRate, setPassRate] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, schedulesRes, attemptsRes] = await Promise.all([
        supabase.from("profiles").select("name, profile_completion_percentage").eq("id", user.id).single(),
        supabase.from("schedules").select("status").eq("student_id", user.id),
        supabase.from("test_attempts").select("passed").eq("student_id", user.id),
      ]);

      setProfile(profileRes.data);
      const schedules = schedulesRes.data ?? [];
      setUpcomingTests(schedules.filter((s) => s.status === "registered").length);
      setCompletedTests(schedules.filter((s) => s.status === "completed").length);

      const attempts = attemptsRes.data ?? [];
      const passed = attempts.filter((a) => a.passed).length;
      setPassRate(attempts.length > 0 ? Math.round((passed / attempts.length) * 100) : 0);
    };
    fetchData();
  }, [user]);

  const completion = profile?.profile_completion_percentage ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {profile?.name || "Student"}
        </h1>
        <p className="text-muted-foreground">Your placement journey at a glance</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserCircle className="h-4 w-4" /> Profile Completion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={completion} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {completion}% complete — {completion < 80 ? "Complete 80% to take tests" : "You're eligible for tests!"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Tests</CardTitle>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tests Completed</CardTitle>
            <ClipboardList className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
            <Trophy className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{passRate}%</div>
          </CardContent>
        </Card>
      </div>

      <EligibilityChecker />
    </div>
  );
}
