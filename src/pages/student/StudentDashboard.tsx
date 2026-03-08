import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Trophy, ClipboardList, UserCircle, TrendingUp, Zap } from "lucide-react";
import { EligibilityChecker } from "@/components/EligibilityChecker";
import { BentoCard } from "@/components/3d/BentoCard";
import { Icon3D } from "@/components/3d/Icon3D";
import { motion } from "framer-motion";

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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Welcome, {profile?.name || "Student"}
        </h1>
        <p className="text-muted-foreground">Your placement journey at a glance</p>
      </motion.div>

      {/* Profile completion — high priority */}
      <BentoCard priority="high" delay={0.1} className="col-span-full">
        <div className="flex items-start gap-4">
          <Icon3D icon={UserCircle} color="blue" size="sm" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Profile Completion</h3>
            <div className="mt-3">
              <Progress value={completion} className="h-2.5 bg-secondary" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {completion}% complete — {completion < 80 ? "Complete 80% to take tests" : "You're eligible for tests!"}
            </p>
          </div>
          <span className="font-display text-2xl font-bold text-foreground">{completion}%</span>
        </div>
      </BentoCard>

      {/* Stats grid — bento */}
      <div className="grid gap-4 sm:grid-cols-3">
        <BentoCard priority="medium" delay={0.2}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Tests</p>
              <p className="mt-2 font-display text-4xl font-bold text-foreground">{upcomingTests}</p>
            </div>
            <Icon3D icon={CalendarDays} color="violet" size="sm" />
          </div>
        </BentoCard>

        <BentoCard priority="medium" delay={0.3}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tests Completed</p>
              <p className="mt-2 font-display text-4xl font-bold text-foreground">{completedTests}</p>
            </div>
            <Icon3D icon={ClipboardList} color="blue" size="sm" />
          </div>
        </BentoCard>

        <BentoCard priority={passRate > 70 ? "high" : "low"} delay={0.4}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pass Rate</p>
              <p className="mt-2 font-display text-4xl font-bold text-foreground">{passRate}%</p>
            </div>
            <Icon3D icon={Trophy} color="orange" size="sm" />
          </div>
        </BentoCard>
      </div>

      <EligibilityChecker />
    </div>
  );
}
