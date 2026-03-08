import { GraduationCap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] px-6 py-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, hsl(220 80% 55%), hsl(260 70% 55%))",
            }}
          >
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-sm font-bold">SmartPlace</span>
        </div>
        <p className="text-xs text-white/25">© 2026 SmartPlace. All rights reserved.</p>
      </div>
    </footer>
  );
}
