import { Building2, CalendarClock, Filter, LineChart } from "lucide-react";

const items = [
  {
    icon: Building2,
    title: "Company Profiles",
    body: "Publish drives with roles, packages, CGPA cut-offs and skill requirements in one place.",
  },
  {
    icon: Filter,
    title: "Instant Shortlisting",
    body: "Candidates are ranked automatically using test score, CGPA and improvement trends.",
  },
  {
    icon: CalendarClock,
    title: "Drive Scheduling",
    body: "Schedule assessments and interview rounds with automated student notifications.",
  },
  {
    icon: LineChart,
    title: "Hiring Analytics",
    body: "Track attempts, pass rates and proctoring integrity for every round you run.",
  },
];

export function LandingRecruiters() {
  return (
    <section id="recruiters" className="scroll-mt-24 px-5 py-24 md:px-16">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-[32px]">
          Built for Recruiters
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Run an entire campus drive end to end — from posting the role to picking the final list.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="glass-panel glass-panel-interactive spring-transition group flex flex-col gap-4 rounded-xl p-6"
          >
            <div className="extrude-icon spring-transition flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 group-hover:bg-primary/20">
              <Icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h3 className="mb-2 font-display text-lg font-bold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
