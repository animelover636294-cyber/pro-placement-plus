import { motion } from "framer-motion";
import { ClipboardList, Brain, Users, Shield, ArrowUpRight } from "lucide-react";
import { Icon3D } from "@/components/3d/Icon3D";

const features = [
  {
    icon: ClipboardList,
    title: "Smart Testing",
    desc: "Randomized question banks with auto-evaluation and anti-cheating tab-switch detection",
    color: "blue" as const,
  },
  {
    icon: Brain,
    title: "AI Feedback",
    desc: "Personalized improvement plans powered by AI with detailed performance breakdowns",
    color: "violet" as const,
  },
  {
    icon: Users,
    title: "Company Portal",
    desc: "Streamlined shortlisting, resume access, and eligibility-based matching",
    color: "orange" as const,
  },
  {
    icon: Shield,
    title: "Extensible & Secure",
    desc: "Enterprise-grade security with MFA, audit logs, and role-based access control",
    color: "emerald" as const,
  },
];

const marqueeItems = ["VERBAL", "APTITUDE", "REASONING", "CODING", "ANALYTICS", "PLACEMENT", "INTERVIEW", "RESUME"];

export function LandingFeatures() {
  return (
    <>
      {/* Marquee */}
      <div className="relative z-10 mt-4 overflow-hidden border-y border-white/[0.04] bg-white/[0.01] py-4">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="mx-6 font-display text-sm font-bold uppercase tracking-[0.2em] text-white/15">
              {item} <span className="mx-4 text-primary/40">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <motion.h2
              className="font-display text-4xl font-bold sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">succeed</span>
            </motion.h2>
            <motion.p
              className="mx-auto mt-4 max-w-lg text-base text-white/35"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              A comprehensive placement platform designed for modern educational institutions
            </motion.p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:border-white/[0.12]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 30px 60px -15px hsl(220 80% 50% / 0.15)",
                }}
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 30% 30%, hsl(220 80% 50% / 0.05), transparent 60%)` }}
                />
                <div className="relative z-10">
                  <Icon3D icon={feature.icon} color={feature.color} />
                  <h3 className="mt-5 font-display text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/40">{feature.desc}</p>
                  <div className="mt-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/25 transition group-hover:border-primary/30 group-hover:text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
