type AuthVisualPanelProps = {
  headline?: string;
  tagline?: string;
};

export function AuthVisualPanel({
  headline = "Welcome",
  tagline = "Secure access to your investor portfolio, documents, and deal flow.",
}: AuthVisualPanelProps) {
  return (
    <div className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-[#07111f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(212,168,83,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(56,120,180,0.22),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,28,52,0.95)_0%,rgba(12,42,74,0.75)_45%,rgba(18,58,92,0.9)_100%)]" />

      <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-[#d4a853]/10 blur-3xl" />
      <div className="absolute bottom-16 right-8 h-96 w-96 rounded-full bg-[#2d6a9f]/20 blur-3xl" />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="auth-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M48 0H0V48"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-12 xl:p-16">
        <div className="text-xs font-medium uppercase tracking-[0.35em] text-white/50">
          DarkAlpha Capital
        </div>

        <div className="max-w-md space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.55em] text-white/70">
            {headline}
          </p>
          <h2 className="text-4xl font-light leading-tight tracking-wide text-white xl:text-5xl">
            Investor Portal
          </h2>
          <p className="text-base leading-relaxed text-white/60">{tagline}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="h-px w-8 bg-white/20" />
          <span>Private markets · Institutional grade</span>
        </div>
      </div>
    </div>
  );
}
