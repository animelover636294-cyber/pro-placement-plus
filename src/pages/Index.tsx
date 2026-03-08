import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Users, ClipboardList, BarChart3, Sparkles, Zap, Shield } from "lucide-react";
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
    <div className="relative flex min-h-screen flex-col overflow-hidden gradient-hero-bg">
      {/* Floating orbs for depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl animate-glow" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-primary/25">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">SmartPlace</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="font-medium" onClick={() => navigate("/login")}>
            Sign in
          </Button>
          <Button
            className="gradient-bg border-0 font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            onClick={() => navigate("/signup")}
          >
            Get started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Powered Placement Platform
          </div>

          <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Smart Placements,{" "}
            <span className="gradient-text">Brighter Futures</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Streamline campus placements with intelligent testing, AI-powered feedback, and comprehensive analytics — all in one platform.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="gradient-bg border-0 px-8 py-6 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              onClick={() => navigate("/signup")}
            >
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="glass px-8 py-6 text-base font-semibold hover:bg-secondary/50 transition-all duration-300"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid max-w-4xl gap-6 sm:grid-cols-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {[
            {
              icon: ClipboardList,
              title: "Smart Testing",
              desc: "Randomized question banks with auto-evaluation and anti-cheating measures",
              gradient: "from-primary/20 to-primary/5",
            },
            {
              icon: BarChart3,
              title: "AI Feedback",
              desc: "Personalized improvement plans and detailed performance analytics",
              gradient: "from-accent/20 to-accent/5",
            },
            {
              icon: Users,
              title: "Company Portal",
              desc: "Streamlined shortlisting, resume access, and direct company-student connections",
              gradient: "from-success/20 to-success/5",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group glass rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient}`}>
                <f.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-16 mb-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {[
            { icon: Shield, text: "Enterprise-grade security" },
            { icon: Zap, text: "Real-time analytics" },
            { icon: Sparkles, text: "AI-powered insights" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-primary" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
