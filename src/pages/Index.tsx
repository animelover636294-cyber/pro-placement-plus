import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Users, ClipboardList, BarChart3 } from "lucide-react";
import { useEffect } from "react";

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, role, loading, navigate]);

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">SmartPlace</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/login")}>Sign in</Button>
          <Button onClick={() => navigate("/signup")}>Get started</Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight">
          AI-Driven Smart Placement Platform
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Streamline campus placements with intelligent testing, AI-powered feedback, and comprehensive analytics.
        </p>
        <div className="mt-8 flex gap-3">
          <Button size="lg" onClick={() => navigate("/signup")}>
            Get started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        </div>

        <div className="mt-16 grid max-w-3xl gap-8 sm:grid-cols-3">
          {[
            { icon: ClipboardList, title: "Smart Testing", desc: "Randomized questions with auto-evaluation" },
            { icon: BarChart3, title: "AI Feedback", desc: "Personalized improvement plans for students" },
            { icon: Users, title: "Company Portal", desc: "Streamlined shortlisting and resume access" },
          ].map((f) => (
            <div key={f.title} className="space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
