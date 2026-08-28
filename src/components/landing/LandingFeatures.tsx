import { BrainCircuit, FileCheck2, Megaphone, ShieldCheck } from "lucide-react";

export function LandingFeatures() {
  return (
    <section id="solutions" className="flex scroll-mt-24 flex-col gap-12 px-5 py-24 md:px-16">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-[32px]">
          Engineered for Precision
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Everything you need to orchestrate high-stakes recruitment events seamlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="glass-panel glass-panel-interactive spring-transition group flex flex-col gap-4 rounded-xl p-6">
          <div className="extrude-icon spring-transition flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 group-hover:bg-primary/20">
            <FileCheck2 className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h3 className="mb-2 font-display text-xl font-bold text-foreground">Automated Eligibility</h3>
            <p className="text-sm text-muted-foreground">
              Instantly filter candidates based on exact academic criteria and role requirements.
            </p>
          </div>
        </article>

        <article className="glass-panel glass-panel-interactive spring-transition group flex flex-col gap-4 rounded-xl bg-gradient-to-br from-card/10 to-primary/10 p-6 lg:col-span-2">
          <div className="extrude-icon spring-transition flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 group-hover:bg-primary/20">
            <ShieldCheck className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="mt-auto">
            <h3 className="mb-2 font-display text-xl font-bold text-foreground">
              Secure Proctored Assessments
            </h3>
            <p className="text-sm text-muted-foreground">
              Military-grade anti-cheat systems with AI-driven behavioral analysis and live webcam monitoring.
            </p>
          </div>
        </article>

        <article className="glass-panel glass-panel-interactive spring-transition group flex flex-col gap-4 rounded-xl p-6">
          <div className="extrude-icon spring-transition flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 group-hover:bg-primary/20">
            <BrainCircuit className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h3 className="mb-2 font-display text-xl font-bold text-foreground">AI Question Generation</h3>
            <p className="text-sm text-muted-foreground">
              Generate dynamic, adaptive question banks on the fly to prevent question leakage.
            </p>
          </div>
        </article>

        <article className="glass-panel glass-panel-interactive spring-transition group flex flex-col gap-4 rounded-xl p-6 lg:col-span-4">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="extrude-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary/60">
              <Megaphone className="h-7 w-7 text-accent-foreground" />
            </div>
            <div>
              <h3 className="mb-2 font-display text-xl font-bold text-foreground">Real-Time Notifications</h3>
              <p className="text-muted-foreground">
                Keep students and recruiters perfectly aligned with instant email and in-app alerts for
                every stage of the placement lifecycle.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
