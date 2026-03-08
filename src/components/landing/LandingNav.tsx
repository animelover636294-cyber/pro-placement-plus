import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary border border-border">
          <GraduationCap className="h-5 w-5 text-foreground" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-foreground">SmartPlace</span>
      </div>
      <nav className="hidden items-center gap-8 md:flex">
        {["Platform", "Features", "About"].map((item) => (
          <button key={item} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            {item}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            className="font-semibold"
            onClick={() => navigate("/signup")}
          >
            Join Now
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
}
