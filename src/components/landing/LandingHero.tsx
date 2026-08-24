import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, ArrowRight } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import hero1280 from "@/assets/hero-dashboard-1280.jpg";
import hero960 from "@/assets/hero-dashboard-960.jpg";
import hero640 from "@/assets/hero-dashboard-640.jpg";

const HERO_BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAQABQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlBsxwo6ClVVBGV479qIihADYHy9mpAykjLAfjVgRz4MmVGAR0op5aMkkt+lFKwH//2Q==";


export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="grid min-h-[640px] grid-cols-1 items-center gap-12 px-5 pt-32 md:px-16 lg:grid-cols-2">
      <motion.div
        className="z-10 flex flex-col gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <p className="label-caps tracking-[0.18em] text-accent-foreground">Elite Campus Recruitment</p>
        <h1 className="font-display text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[64px]">
          Placements,
          <br />
          <span className="text-glow bg-gradient-to-r from-[hsl(248_100%_87%)] to-primary bg-clip-text text-transparent">
            run like a product
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          Engineered for high-tier professionals. Automate eligibility, run tamper-proof proctored
          assessments, and place with precision instrumentation—from one unified, intelligent hub.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <button
            className="label-caps spring-transition rounded-lg bg-primary px-8 py-4 text-primary-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_24px_hsl(var(--primary)/0.45)] hover:scale-105 active:scale-95"
            onClick={() => navigate("/signup")}
          >
            Get Started
          </button>
          <a
            href="#features"
            className="label-caps glass-button spring-transition flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-center text-foreground"
          >
            View Demo <ArrowRight className="h-4 w-4 text-accent-foreground" />
          </a>
        </div>
      </motion.div>

      <div className="perspective-container relative hidden h-[500px] w-full lg:block">
        <div className="hero-bento absolute inset-0 h-full w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <OptimizedImage
              src={hero1280}
              srcSetMap={{ 640: hero640, 960: hero960, 1280: hero1280 }}
              sizes="(max-width: 1024px) 0px, (max-width: 1440px) 45vw, 640px"
              blurDataURL={HERO_BLUR}
              width={1280}
              height={1024}
              priority
              alt="Pro Placement Plus dashboard showing placement analytics and a live proctoring session"
              className="drop-shadow-[0_30px_60px_hsl(var(--primary)/0.25)]"
            />
          </div>


          <div className="glass-panel absolute bottom-[5%] right-[5%] flex items-center gap-3 rounded-xl border-primary/30 bg-card/80 p-4 shadow-[0_0_30px_hsl(var(--primary)/0.25)] backdrop-blur-3xl">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
              <Video className="h-4 w-4 text-destructive" />
              <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-destructive" />
            </div>
            <div>
              <div className="label-caps text-foreground">Live Proctoring</div>
              <div className="text-xs text-muted-foreground">Active session</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
