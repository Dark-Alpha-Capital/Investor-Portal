import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { generateNoIndexMetadata } from "@/lib/seo";
import { TRPCReactProvider } from "@/trpc/client";

const meta = generateNoIndexMetadata("Sign In | DarkAlpha Capital");

function metaTitle(): string {
  const t = meta.title;
  return typeof t === "string" ? t : (t?.default ?? "Sign In");
}

export const Route = createFileRoute("/(auth)")({
  head: () => ({
    meta: [
      { title: metaTitle() },
      ...(meta.robots
        ? [{ name: "robots", content: "noindex, nofollow" } as const]
        : []),
    ],
  }),
  component: AuthShell,
});

function AuthShell() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        <Outlet />
      </TRPCReactProvider>
      <Toaster />
    </ThemeProvider>
  );
}
