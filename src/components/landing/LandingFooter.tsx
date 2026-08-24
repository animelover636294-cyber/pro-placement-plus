export function LandingFooter() {
  return (
    <footer className="relative z-10 mt-24 flex w-full flex-col items-center justify-between gap-4 border-t border-border/20 bg-card/40 px-5 py-12 backdrop-blur-md md:flex-row md:px-16">
      <div className="font-display text-xl font-bold text-muted-foreground">Intelligent Placement Management System</div>
      <div className="text-center text-sm text-muted-foreground md:text-left">
        © {new Date().getFullYear()} Intelligent Placement Management System. Precision in Placement.
      </div>
      <nav className="flex gap-6">
        <a className="label-caps text-muted-foreground transition-colors hover:text-accent-foreground" href="#features">
          Privacy
        </a>
        <a className="label-caps text-muted-foreground transition-colors hover:text-accent-foreground" href="#features">
          Terms
        </a>
        <a className="label-caps text-muted-foreground transition-colors hover:text-accent-foreground" href="#cta">
          Contact
        </a>
      </nav>
    </footer>
  );
}
