import type { ReactNode } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";

type AuthLayoutProps = {
  children: ReactNode;
  headline?: string;
  tagline?: string;
};

export function AuthLayout({ children, headline, tagline }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <AuthVisualPanel headline={headline} tagline={tagline} />

      <div className="relative flex min-h-screen flex-col bg-background">
        <div className="absolute right-5 top-5 z-10 sm:right-8 sm:top-8">
          <ModeToggle />
        </div>

        <div className="border-b border-border/60 bg-[linear-gradient(135deg,#07111f_0%,#123456_100%)] px-6 py-10 text-white lg:hidden">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            DarkAlpha Capital
          </p>
          <h2 className="mt-3 text-2xl font-light tracking-wide">
            Investor Portal
          </h2>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="auth-form w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
