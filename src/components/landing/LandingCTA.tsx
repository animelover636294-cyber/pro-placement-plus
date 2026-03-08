import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function LandingCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 px-6 py-20 lg:px-12">
      <motion.div
        className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-card/80 p-12 text-center backdrop-blur-xl"
        style={{
          boxShadow: "0 40px 80px -20px hsl(var(--foreground) / 0.1)",
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          Ready to transform your placement process?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          Join thousands of students and institutions already using SmartPlace
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              className="px-8 py-6 text-base font-bold"
              onClick={() => navigate("/signup")}
            >
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base font-semibold"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
