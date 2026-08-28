import { Quote } from "lucide-react";

const stories = [
  {
    quote:
      "We moved our entire placement cycle onto the platform. Shortlisting that used to take two days now happens the moment the test closes.",
    name: "Placement Cell",
    role: "Engineering Campus",
  },
  {
    quote:
      "The proctoring timeline gives us real evidence for every attempt, so results are defensible when a company asks questions.",
    name: "Training & Placement Officer",
    role: "Autonomous Institute",
  },
  {
    quote:
      "As a student, the assistant showed exactly where I was losing marks. My second attempt score jumped noticeably.",
    name: "Final Year Student",
    role: "Computer Science",
  },
];

export function LandingSuccess() {
  return (
    <section id="success-stories" className="scroll-mt-24 px-5 py-24 md:px-16">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-[32px]">
          Success Stories
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          How placement teams and students use the platform every drive season.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {stories.map((s) => (
          <figure
            key={s.name}
            className="glass-panel glass-panel-interactive spring-transition flex flex-col gap-5 rounded-xl p-6"
          >
            <Quote className="h-6 w-6 text-accent-foreground" />
            <blockquote className="text-sm leading-relaxed text-muted-foreground">
              {s.quote}
            </blockquote>
            <figcaption className="mt-auto">
              <div className="font-display text-sm font-bold text-foreground">{s.name}</div>
              <div className="label-caps text-muted-foreground">{s.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
