import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Deep navy base gradient */}
      <div className="absolute inset-0 bg-[#0a0e1a]" />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/4 left-1/3 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(220 80% 50% / 0.15), transparent 70%)",
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(260 70% 55% / 0.12), transparent 70%)",
        }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.95, 1.08, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(24 100% 50% / 0.08), transparent 70%)",
        }}
        animate={{
          x: [0, 40, -10, 0],
          y: [0, -20, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Glowing 3D sphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative h-[300px] w-[300px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle at 35% 35%, hsl(220 80% 60% / 0.4), hsl(260 70% 50% / 0.2) 50%, transparent 70%)",
            boxShadow: "0 0 120px 60px hsl(220 80% 50% / 0.1), inset 0 0 80px hsl(260 70% 55% / 0.15)",
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(220 50% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 50% 60%) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -60, -120],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
