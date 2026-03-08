import { GraduationCap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-border px-6 py-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-bold text-foreground">SmartPlace</span>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 SmartPlace. All rights reserved.</p>
      </div>
    </footer>
  );
}
