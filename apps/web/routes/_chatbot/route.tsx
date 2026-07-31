import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { MessageSquarePlus } from "lucide-react";
import { ChatSidebar } from "@/components/chatbot/chat-sidebar";
import { ChatbotProviders } from "@/components/chatbot/chatbot-providers";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <ChatbotProviders>
      <ChatSidebar />
      <SidebarInset className="flex max-h-svh flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="text-sm font-medium text-muted-foreground">
            Assistant
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/chat">
              <MessageSquarePlus className="size-4" />
              New chat
            </Link>
          </Button>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden" key={pathname}>
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster />
    </ChatbotProviders>
  );
}
