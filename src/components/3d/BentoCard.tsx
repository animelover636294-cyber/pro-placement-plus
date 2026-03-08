import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  priority?: "high" | "medium" | "low";
  delay?: number;
}

const priorityStyles = {
  high: {
    shadow: "0 30px 80px -20px hsl(220 80% 50% / 0.2), 0 0 0 1px hsl(220 80% 50% / 0.1)",
    scale: 1.02,
    glow: "hsl(220 80% 50% / 0.1)",
  },
  medium: {
    shadow: "0 20px 60px -15px hsl(260 70% 55% / 0.15), 0 0 0 1px hsl(260 70% 55% / 0.08)",
    scale: 1.01,
    glow: "hsl(260 70% 55% / 0.08)",
  },
  low: {
    shadow: "0 15px 40px -10px hsl(0 0% 0% / 0.3), 0 0 0 1px hsl(0 0% 100% / 0.05)",
    scale: 1.005,
    glow: "transparent",
  },
};

export function BentoCard({ children, className = "", priority = "low", delay = 0 }: BentoCardProps) {
  const style = priorityStyles[priority];

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md transition-colors hover:border-white/[0.12] ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{
        scale: style.scale,
        boxShadow: style.shadow,
        y: priority === "high" ? -8 : priority === "medium" ? -4 : -2,
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Subtle gradient bg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at 50% 50%, ${style.glow}, transparent 70%)` }}
      />
      <div className="relative z-10 p-6">{children}</div>
    </motion.div>
  );
}
