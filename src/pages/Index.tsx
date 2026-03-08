import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ArrowRight,
  ArrowUpRight,
  Users,
  ClipboardList,
  BarChart3,
  Sparkles,
  Shield,
  BookOpen,
  Brain,
} from "lucide-react";
import { useEffect } from "react";

const stats = [
  { value: "12+", label: "Partner Companies" },
  { value: "8K+", label: "Students Placed" },
  { value: "4.3K+", label: "Tests Completed" },
];

const features = [
  {
    icon: ClipboardList,
    title: "Smart Testing",
    desc: "Randomized question banks with auto-evaluation and anti-cheating tab-switch detection",
    color: "bg-gradient-primary",
  },
  {
    icon: Brain,
    title: "AI Feedback",
    desc: "Personalized improvement plans powered by AI with detailed performance breakdowns",
    color: "bg-accent",
  },
  {
    icon: Users,
    title: "Company Portal",
    desc: "Streamlined shortlisting, resume access, and eligibility-based matching",
    color: "bg-gradient-primary",
  },
  {
    icon: Shield,
    title: "Extensible & Secure",
    desc: "Enterprise-grade security with MFA, audit logs, and role-based access control",
    color: "bg-accent",
  },
];

const marqueeItems = [
  "VERBAL",
  "APTITUDE",
  "REASONING",
  "CODING",
  "ANALYTICS",
  "PLACEMENT",
  "INTERVIEW",
  "RESUME",
];

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
    <div className="flex min-h-screen flex-col bg-dark-surface text-white overflow-hidden">
      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-3d-primary">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">SmartPlace</span>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          {["Platform", "Features", "About"].map((item) => (
            <button
              key={item}
              className="text-sm font-medium text-white/60 transition hover:text-white"
            >
              {item}
            </button>
          ))}
        </nav>
        <Button
          className="bg-gradient-primary border-0 font-semibold shadow-3d-primary hover:opacity-90 transition-all"
          onClick={() => navigate("/signup")}
        >
          Join Now
        </Button>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-start px-6 pt-12 pb-8 lg:flex-row lg:items-center lg:px-12 lg:pt-20 lg:pb-16">
        {/* Left */}
        <div className="flex-1 animate-fade-in-up">
          <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            PLATFORM TO FIND{" "}
            <span className="text-gradient-primary">WORK</span>
            <br />
            AND ALSO TO
            <br />
            FIND GREAT{" "}
            <span className="text-gradient-primary">TALENT</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-white/50">
            Search and find your dream placement now easier than ever. Smart testing, AI feedback, and direct company connections — all in one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-primary border-0 px-8 py-6 text-base font-bold shadow-3d-primary hover:opacity-90 transition-all"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 bg-white/5 px-8 py-6 text-base font-semibold text-white backdrop-blur hover:bg-white/10 transition-all"
              onClick={() => navigate("/login")}
            >
              Sign in <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-14 flex gap-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl font-bold">
                  {stat.value.replace("+", "")}
                  <span className="text-gradient-primary">+</span>
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/40">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — 3D Feature Cards */}
        <div className="relative mt-16 flex-1 lg:mt-0" style={{ perspective: "1200px" }}>
          <div className="relative mx-auto max-w-md">
            {/* Card 1 — tilted left */}
            <div className="card-3d-left absolute -left-4 top-0 z-10 w-64 rounded-2xl bg-gradient-primary p-6 shadow-3d-primary card-float">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Testing</h3>
              <p className="mt-2 text-sm text-white/70">
                Randomized questions with auto-evaluation
              </p>
              <div className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Card 2 — tilted right, overlapping */}
            <div className="card-3d-right relative left-24 top-8 z-20 w-72 rounded-2xl bg-accent p-6 shadow-3d card-float-delayed">
              <h3 className="text-xl font-bold text-white">Extensible & Secure</h3>
              <p className="mt-3 text-sm text-white/70">
                Enterprise-grade security with MFA, audit logs, and role-based access
              </p>
              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <ArrowUpRight className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -right-6 -top-6 z-30 flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-bold text-white shadow-3d-primary">
              <Sparkles className="h-3 w-3" /> AI Powered
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="relative z-10 mt-4 overflow-hidden border-y border-white/5 bg-white/[0.02] py-4">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="mx-6 font-display text-sm font-bold uppercase tracking-[0.2em] text-white/20"
            >
              {item} <span className="mx-4 text-primary">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-bold sm:text-5xl">
              Everything you need to{" "}
              <span className="text-gradient-primary">succeed</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/40">
              A comprehensive placement platform designed for modern educational institutions
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="card-3d group rounded-2xl border border-white/5 bg-dark-elevated p-8 transition-all hover:border-primary/20"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} shadow-lg`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{feature.desc}</p>
                <div className="mt-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/30 transition group-hover:border-primary group-hover:text-primary">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-primary p-12 text-center shadow-3d-primary">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to transform your placement process?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/70">
            Join thousands of students and institutions already using SmartPlace
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-white px-8 py-6 text-base font-bold text-primary hover:bg-white/90 shadow-lg transition-all"
              onClick={() => navigate("/signup")}
            >
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent px-8 py-6 text-base font-semibold text-white hover:bg-white/10 transition-all"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-bold">SmartPlace</span>
          </div>
          <p className="text-xs text-white/30">© 2026 SmartPlace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
