import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

const links = [
  { label: "Solutions", href: "#features" },
  { label: "Recruiters", href: "#features" },
  { label: "Success Stories", href: "#cta" },
  { label: "Pricing", href: "#cta" },
];

export function LandingNav() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-b border-border/40 bg-card/40 px-5 backdrop-blur-md md:px-16">
      <div className="font-display text-2xl font-bold tracking-tighter text-foreground md:text-[32px]">
        Intelligent Placement Management System
      </div>

      <nav className="hidden items-center gap-6 md:flex">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="label-caps text-muted-foreground transition-colors hover:text-accent-foreground"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="glass-panel glass-panel-interactive hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:text-accent-foreground md:flex"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          className="label-caps hidden text-muted-foreground transition-colors hover:text-accent-foreground md:block"
          onClick={() => navigate("/login")}
        >
          Log In
        </button>
        <button
          className="label-caps spring-transition rounded-lg bg-primary px-6 py-3 text-primary-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:scale-[0.97]"
          onClick={() => navigate("/signup")}
        >
          Get Started
        </button>
      </div>
    </header>
  );
}
