import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, ClipboardList, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { value: "12", suffix: "+", label: "Partner Companies" },
  { value: "8K", suffix: "+", label: "Students Placed" },
  { value: "4.3K", suffix: "+", label: "Tests Completed" },
];

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 flex flex-col items-start px-6 pt-12 pb-8 lg:flex-row lg:items-center lg:px-12 lg:pt-20 lg:pb-16">
      <div className="flex-1">
        <motion.h1
          className="font-display text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl text-foreground"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          YOUR SMART
          <br />
          <span className="text-muted-foreground">PLACEMENT</span>
          <br />
          COMPANION
        </motion.h1>

        <motion.p
          className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          AI-powered testing, personalized feedback, and seamless company matching — everything you need to land your dream placement.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              className="px-8 py-6 text-base font-bold"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base font-semibold"
              onClick={() => navigate("/login")}
            >
              Sign in <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-14 flex gap-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-3xl font-bold text-foreground">
                {stat.value}
                <span className="text-muted-foreground">{stat.suffix}</span>
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right — 3D Feature Cards */}
      <div className="relative mt-16 flex-1 lg:mt-0" style={{ perspective: "1200px" }}>
        <div className="relative mx-auto max-w-md">
          {/* Card 1 */}
          <motion.div
            className="absolute -left-4 top-0 z-10 w-64 rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-xl"
            style={{
              boxShadow: "0 25px 60px -15px hsl(var(--foreground) / 0.15)",
            }}
            initial={{ opacity: 0, x: -40, rotateY: 20 }}
            animate={{ opacity: 1, x: 0, rotateY: 8 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            whileHover={{ rotateY: 3, scale: 1.03, y: -5 }}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <ClipboardList className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Smart Testing</h3>
            <p className="mt-2 text-sm text-muted-foreground">Randomized questions with auto-evaluation</p>
            <div className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            className="relative left-24 top-8 z-20 w-72 rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-xl"
            style={{
              boxShadow: "0 25px 60px -15px hsl(var(--foreground) / 0.15)",
            }}
            initial={{ opacity: 0, x: 40, rotateY: -20 }}
            animate={{ opacity: 1, x: 0, rotateY: -8 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            whileHover={{ rotateY: -3, scale: 1.03, y: -5 }}
          >
            <h3 className="text-xl font-bold text-foreground">Extensible & Secure</h3>
            <p className="mt-3 text-sm text-muted-foreground">Enterprise-grade security with MFA, audit logs, and role-based access</p>
            <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </motion.div>

          {/* Floating badge */}
          <motion.div
            className="absolute -right-6 -top-6 z-30 flex items-center gap-1.5 rounded-full border border-border bg-primary text-primary-foreground px-4 py-2 text-xs font-bold backdrop-blur-lg"
            style={{
              boxShadow: "0 10px 30px -5px hsl(var(--foreground) / 0.1)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
            whileHover={{ scale: 1.1 }}
          >
            <Sparkles className="h-3.5 w-3.5" /> AI Powered
          </motion.div>
        </div>
      </div>
    </section>
  );
}
