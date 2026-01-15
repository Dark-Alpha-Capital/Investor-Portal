"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Lock } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

type Props = {
  ticketId: string;
};

export function AddCommentForm({ ticketId }: Props) {
  const router = useRouter();
  const trpc = useTRPC();

  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const addComment = useMutation(
    trpc.tickets.addAdminComment.mutationOptions({
      onSuccess: () => {
        setContent("");
        setIsInternal(false);
        router.refresh();
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addComment.mutate({
      ticketId,
      content: content.trim(),
      isInternal,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Comment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Type your comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="internal"
                checked={isInternal}
                onCheckedChange={(checked) => setIsInternal(checked === true)}
              />
              <Label
                htmlFor="internal"
                className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer"
              >
                <Lock className="h-3 w-3" />
                Internal note (not visible to investor)
              </Label>
            </div>

            <Button
              type="submit"
              disabled={!content.trim() || addComment.isPending}
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
