import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function LandingCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 px-6 py-20 lg:px-12">
      <motion.div
        className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/[0.1] p-12 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(40px)",
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
          Ready to transform your placement process?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-white/40">
          Join thousands of students and institutions already using SmartPlace
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              className="bg-white text-black px-8 py-6 text-base font-bold hover:bg-white/90 shadow-lg transition-all"
              onClick={() => navigate("/signup")}
            >
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              variant="outline"
              className="border-white/[0.12] bg-transparent px-8 py-6 text-base font-semibold text-white hover:bg-white/[0.06] transition-all"
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
