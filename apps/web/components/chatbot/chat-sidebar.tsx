"use client";

import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Briefcase,
  ChartBar,
  FileText,
  Home,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  createChatFn,
  deleteChatFn,
  fetchChatList,
} from "@/lib/server-fns/chatbot-route-data";
import type { ChatListItem } from "@/lib/chat/chat-store";
import { DEFAULT_CHAT_MODEL_ID } from "@repo/ai-core";
import { getAppHomePath } from "@/lib/auth/user-role-guards";
import type { Session } from "@/lib/auth/session-types";
import { cn } from "@/lib/utils";

const appNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: ChartBar },
  { title: "Docs", url: "/onboarding", icon: FileText },
  { title: "Deals", url: "/deals", icon: Briefcase },
] as const;

export function ChatSidebar({ session }: { session: Session }) {
  const params = useParams({ strict: false }) as { chatId?: string };
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [chatToDelete, setChatToDelete] = useState<ChatListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const dashboardPath =
    session?.user != null ? getAppHomePath(session.user) : "/dashboard";

  const refresh = () => {
    startTransition(async () => {
      const result = await fetchChatList();
      if (result.tag === "ok") {
        setChats(result.chats);
      }
    });
  };

  useEffect(() => {
    refresh();
  }, [params.chatId]);

  const handleNewChat = () => {
    startTransition(async () => {
      const result = await createChatFn({
        data: { model: DEFAULT_CHAT_MODEL_ID },
      });
      if (result.tag === "ok") {
        void navigate({
          to: "/chat/$chatId",
          params: { chatId: result.chatId },
        });
        refresh();
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!chatToDelete || isDeleting) {
      return;
    }

    const deletingId = chatToDelete.id;
    setIsDeleting(true);

    startTransition(async () => {
      try {
        const result = await deleteChatFn({ data: { chatId: deletingId } });
        switch (result.tag) {
          case "ok": {
            setChats((prev) => prev.filter((chat) => chat.id !== deletingId));
            toast.success("Chat deleted");
            if (params.chatId === deletingId) {
              void navigate({ to: "/chat" });
            }
            break;
          }
          case "not_found": {
            setChats((prev) => prev.filter((chat) => chat.id !== deletingId));
            toast.error("Chat not found");
            break;
          }
          case "redirect": {
            void navigate({ to: result.to });
            break;
          }
          default: {
            const _exhaustive: never = result;
            void _exhaustive;
            toast.error("Failed to delete chat");
          }
        }
      } catch {
        toast.error("Failed to delete chat");
      } finally {
        setIsDeleting(false);
        setChatToDelete(null);
      }
    });
  };

  return (
    <>
      <Sidebar collapsible="offcanvas" className="border-r">
        <SidebarHeader className="gap-2 border-b p-3">
          <div className="flex items-center gap-2 px-1">
            <MessageSquare className="size-4" />
            <span className="font-semibold tracking-tight">Chats</span>
          </div>
          <Button
            className="w-full justify-start gap-2"
            disabled={isPending}
            onClick={handleNewChat}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Plus className="size-4 shrink-0" />
            New chat
          </Button>
          <div className="flex items-center gap-1">
            {appNavItems.map((item) => {
              const href =
                item.title === "Dashboard" ? dashboardPath : item.url;
              return (
                <Button
                  asChild
                  className="h-8 flex-1"
                  key={item.title}
                  size="sm"
                  title={item.title}
                  type="button"
                  variant="outline"
                >
                  <Link to={href}>
                    <item.icon className="size-4" />
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chats.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    No chats yet
                  </p>
                ) : (
                  chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={params.chatId === chat.id}
                        tooltip={chat.title}
                      >
                        <Link
                          className={cn("truncate")}
                          params={{ chatId: chat.id }}
                          to="/chat/$chatId"
                        >
                          <span className="truncate">{chat.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        aria-label={`Delete ${chat.title}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setChatToDelete(chat);
                        }}
                        showOnHover
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AlertDialog
        open={chatToDelete != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setChatToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {chatToDelete?.title
                ? ` “${chatToDelete.title}”`
                : " this chat"}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
