import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Building2, Users, UserCheck, ClipboardList, Trophy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface TestRow {
  id: string;
  title: string;
  scheduled_date: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  registrations: number;
  attempts: number;
  passed: number;
}

interface Stats {
  company: { id: string; name: string };
  totals: {
    tests: number; registrations: number; uniqueRegisteredStudents: number;
    attempts: number; passed: number; eligibleStudents: number; totalStudents: number;
  };
  tests: TestRow[];
}

export default function CompanyDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke("company-stats");
      if (error || data?.error) toast.error(data?.error ?? "Could not load your dashboard");
      else setStats(data as Stats);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading dashboard…</div>;
  }
  if (!stats) return <p className="text-muted-foreground">No company is linked to this account yet.</p>;

  const cards = [
    { label: "Registered students", value: stats.totals.uniqueRegisteredStudents, icon: Users },
    { label: "Eligible students", value: stats.totals.eligibleStudents, icon: UserCheck },
    { label: "Assessments", value: stats.totals.tests, icon: ClipboardList },
    { label: "Cleared assessments", value: stats.totals.passed, icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Building2 className="h-7 w-7 text-primary" /> {stats.company.name}
          </h1>
          <p className="text-muted-foreground">Recruiter portal overview</p>
        </div>
        <Button asChild><Link to="/company/tests"><Plus className="mr-2 h-4 w-4" /> New assessment</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="glass-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="skeuo-icon h-11 w-11 bg-primary text-primary-foreground"><c.icon className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardContent className="p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Your assessments</h2>
          {stats.tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments yet. Create one to start receiving registrations.</p>
          ) : (
            <div className="space-y-3">
              {stats.tests.map((t) => {
                const now = Date.now();
                const opens = t.registration_opens_at ? new Date(t.registration_opens_at).getTime() : null;
                const closes = t.registration_closes_at ? new Date(t.registration_closes_at).getTime() : null;
                const open = (!opens || opens <= now) && (!closes || closes >= now);
                return (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-white/5 p-4">
                    <div>
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(t.scheduled_date), "MMM d, yyyy h:mm a")}
                        {t.registration_closes_at && ` · registration closes ${format(new Date(t.registration_closes_at), "MMM d, h:mm a")}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={open ? "default" : "secondary"}>{open ? "Registration open" : "Registration closed"}</Badge>
                      <Badge variant="outline">{t.registrations} registered</Badge>
                      <Badge variant="outline">{t.attempts} attempted</Badge>
                      <Badge variant="outline">{t.passed} passed</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
