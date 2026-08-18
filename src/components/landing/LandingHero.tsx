import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video } from "lucide-react";

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="grid min-h-[640px] grid-cols-1 items-center gap-12 px-5 pt-32 md:px-16 lg:grid-cols-2">
      <motion.div
        className="z-10 flex flex-col gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <p className="label-caps tracking-[0.18em] text-accent-foreground">Elite Campus Recruitment</p>
        <h1 className="font-display text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[64px]">
          Placements,
          <br />
          <span className="text-glow bg-gradient-to-r from-[hsl(248_100%_87%)] to-primary bg-clip-text text-transparent">
            run like a product
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          Engineered for high-tier professionals. Automate eligibility, run tamper-proof proctored
          assessments, and place with precision instrumentation—from one unified, intelligent hub.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <button
            className="label-caps spring-transition rounded-lg bg-primary px-8 py-4 text-primary-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_24px_hsl(var(--primary)/0.45)] hover:scale-105 active:scale-95"
            onClick={() => navigate("/signup")}
          >
            Get Started
          </button>
          <a
            href="#features"
            className="label-caps glass-button spring-transition flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-center text-foreground"
          >
            View Demo <ArrowRight className="h-4 w-4 text-accent-foreground" />
          </a>
        </div>
      </motion.div>

      <div className="perspective-container relative hidden h-[500px] w-full lg:block">
        <div className="hero-bento absolute inset-0 h-full w-full">
          <div className="glass-panel absolute left-[10%] top-[10%] flex h-[70%] w-[80%] flex-col gap-4 rounded-xl p-4 shadow-2xl">
            <div className="mb-2 flex gap-2">
              <div className="h-3 w-3 rounded-full bg-secondary" />
              <div className="h-3 w-3 rounded-full bg-secondary" />
              <div className="h-3 w-3 rounded-full bg-secondary" />
            </div>
            <div className="h-12 w-3/4 rounded-md bg-secondary/60" />
            <div className="grid flex-1 grid-cols-3 gap-4">
              <div className="h-full rounded-md bg-secondary/40" />
              <div className="col-span-2 h-full rounded-md bg-secondary/40" />
            </div>
          </div>

          <div className="glass-panel absolute bottom-[5%] right-[5%] flex items-center gap-3 rounded-xl border-primary/30 bg-card/80 p-4 shadow-[0_0_30px_hsl(var(--primary)/0.25)] backdrop-blur-3xl">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
              <Video className="h-4 w-4 text-destructive" />
              <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-destructive" />
            </div>
            <div>
              <div className="label-caps text-foreground">Live Proctoring</div>
              <div className="text-xs text-muted-foreground">Active session</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
