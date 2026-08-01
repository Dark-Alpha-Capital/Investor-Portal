import { createFileRoute, redirect } from "@tanstack/react-router";
import { ChatView } from "@/components/chatbot/chat-view";
import {
  fetchChatById,
  type LoadChatFetchResult,
} from "@/lib/server-fns/chatbot-route-data";

export const Route = createFileRoute("/_chatbot/chat/$chatId")({
  loader: async ({ params }) => {
    const result = (await fetchChatById({
      data: { chatId: params.chatId },
    })) as LoadChatFetchResult;
    if (result.tag === "redirect") {
      throw redirect({ to: result.to });
    }
    if (result.tag === "not_found") {
      throw redirect({ to: "/chat" });
    }
    return { chat: result.chat };
  },
  component: ChatPage,
});

function ChatPage() {
  const { chat } = Route.useLoaderData();

  return (
    <ChatView
      chatId={chat.id}
      initialDealId={chat.dealId}
      initialDealName={chat.dealName}
      initialMessages={chat.messages}
      initialModel={chat.model}
    />
  );
}
