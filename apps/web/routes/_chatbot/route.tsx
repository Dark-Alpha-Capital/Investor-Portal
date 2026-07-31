import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { ChatSidebar } from "@/components/chatbot/chat-sidebar";
import { ChatbotProviders } from "@/components/chatbot/chatbot-providers";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { UserNav } from "@/components/user-nav";
import { fetchSessionForChatbotLayout } from "@/lib/server-fns/chatbot-route-data";
import { generateNoIndexMetadata } from "@/lib/marketing/seo";

const meta = generateNoIndexMetadata("Chat | DarkAlpha Capital");

function metaTitle(): string {
  const t = meta.title;
  return typeof t === "string" ? t : (t?.default ?? "Chat");
}

export const Route = createFileRoute("/_chatbot")({
  beforeLoad: async () => {
    const r = await fetchSessionForChatbotLayout();
    if (r.tag === "redirect") {
      throw redirect({ to: r.to });
    }
    return { session: r.session };
  },
  head: () => ({
    meta: [
      { title: metaTitle() },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ChatbotShell,
});

function ChatbotShell() {
  const { session } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <ChatbotProviders>
      <ChatSidebar session={session} />
      <SidebarInset className="flex max-h-svh flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="text-muted-foreground md:hidden" />
            <div className="text-sm font-medium text-muted-foreground">
              Assistant
            </div>
          </div>
          <UserNav session={session} />
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden" key={pathname}>
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster />
    </ChatbotProviders>
  );
}
