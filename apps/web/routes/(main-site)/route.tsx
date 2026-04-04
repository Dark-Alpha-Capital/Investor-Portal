import { Outlet, createFileRoute } from "@tanstack/react-router";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { generatePageMetadata, siteConfig } from "@/lib/seo";
import { TRPCReactProvider } from "@/trpc/client";

const siteMeta = generatePageMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: [
    "private equity",
    "venture capital",
    "accredited investor",
    "investment platform",
    "alternative investments",
    "DarkAlpha Capital",
  ],
});

function metaTitle(): string {
  const t = siteMeta.title;
  return typeof t === "string" ? t : siteConfig.name;
}

export const Route = createFileRoute("/(main-site)")({
  head: () => ({
    meta: [
      { title: metaTitle() },
      ...(siteMeta.description
        ? [{ name: "description", content: siteMeta.description }]
        : []),
    ],
  }),
  component: MainSiteLayout,
});

function MainSiteLayout() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Header />
      <TRPCReactProvider>
        <Outlet />
      </TRPCReactProvider>
      <Footer />
      <Toaster />
    </ThemeProvider>
  );
}
