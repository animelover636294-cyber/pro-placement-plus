export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="ambient-blob left-[-100px] top-[-100px] h-[600px] w-[600px] bg-primary opacity-30" />
      <div
        className="ambient-blob bottom-[-50px] right-[-50px] h-[500px] w-[500px] bg-[hsl(262_70%_50%)] opacity-25"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="ambient-blob left-[60%] top-[40%] h-[400px] w-[400px] bg-[hsl(248_100%_87%)] opacity-[0.12]"
        style={{ animationDelay: "-10s" }}
      />
    </div>
  );
}
