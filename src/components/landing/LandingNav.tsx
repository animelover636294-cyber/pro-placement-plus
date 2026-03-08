import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export function LandingNav() {
  const navigate = useNavigate();

  return (
    <motion.header
      className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-12"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, hsl(220 80% 55%), hsl(260 70% 55%))",
            boxShadow: "0 8px 25px -5px hsl(220 80% 50% / 0.4)",
          }}
          whileHover={{ rotateY: 20, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <GraduationCap className="h-5 w-5 text-white" />
        </motion.div>
        <span className="font-display text-xl font-bold tracking-tight">SmartPlace</span>
      </div>
      <nav className="hidden items-center gap-8 md:flex">
        {["Platform", "Features", "About"].map((item) => (
          <button key={item} className="text-sm font-medium text-white/40 transition hover:text-white">
            {item}
          </button>
        ))}
      </nav>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Button
          className="bg-gradient-to-r from-primary to-primary/80 border-0 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          onClick={() => navigate("/signup")}
        >
          Join Now
        </Button>
      </motion.div>
    </motion.header>
  );
}
