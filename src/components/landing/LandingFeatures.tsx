import { motion } from "framer-motion";
import { ClipboardList, Brain, Users, Shield, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Smart Testing",
    desc: "Randomized question banks with auto-evaluation and anti-cheating tab-switch detection",
  },
  {
    icon: Brain,
    title: "AI Feedback",
    desc: "Personalized improvement plans powered by AI with detailed performance breakdowns",
  },
  {
    icon: Users,
    title: "Company Portal",
    desc: "Streamlined shortlisting, resume access, and eligibility-based matching",
  },
  {
    icon: Shield,
    title: "Extensible & Secure",
    desc: "Enterprise-grade security with MFA, audit logs, and role-based access control",
  },
];

const marqueeItems = ["VERBAL", "APTITUDE", "REASONING", "CODING", "ANALYTICS", "PLACEMENT", "INTERVIEW", "RESUME"];

export function LandingFeatures() {
  return (
    <>
      {/* Marquee */}
      <div className="relative z-10 mt-4 overflow-hidden border-y border-white/[0.06] bg-white/[0.01] py-4">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="mx-6 font-display text-sm font-bold uppercase tracking-[0.2em] text-white/10">
              {item} <span className="mx-4 text-white/20">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <motion.h2
              className="font-display text-4xl font-bold text-white sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Everything you need to{" "}
              <span className="text-white/50">succeed</span>
            </motion.h2>
            <motion.p
              className="mx-auto mt-4 max-w-lg text-base text-white/30"
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
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.4)" }}
              >
                <div className="relative z-10">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.08] border border-white/[0.1]">
                    <feature.icon className="h-6 w-6 text-white/80" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/35">{feature.desc}</p>
                  <div className="mt-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/20 transition group-hover:border-white/20 group-hover:text-white/50">
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
