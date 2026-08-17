import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const stats = [
  { value: "1,248", label: "Students Tracked" },
  { value: "74.2%", label: "Global Pass Rate" },
  { value: "24/7", label: "Proctored Coverage" },
];

export function LandingCTA() {
  const navigate = useNavigate();

  return (
    <section id="cta" className="px-5 pb-8 md:px-16">
      <div className="glass-panel glow-active flex flex-col gap-10 rounded-2xl p-8 md:p-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="font-display text-4xl font-bold text-primary">{s.value}</span>
              <span className="label-caps text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-6 border-t border-border/40 pt-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-[32px]">
              Ready to run your next drive?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Onboard your cohort, publish opportunities and launch proctored assessments today.
            </p>
          </div>
          <button
            className="label-caps spring-transition flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-primary-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_20px_hsl(var(--primary)/0.3)] hover:scale-[0.97]"
            onClick={() => navigate("/signup")}
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
