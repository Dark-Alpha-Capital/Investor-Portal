"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, HelpCircle } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

const CATEGORIES = [
  { value: "credentials", label: "Login/Credentials", description: "Password resets, login issues" },
  { value: "documents", label: "Documents", description: "Document access or questions" },
  { value: "profile", label: "Profile Update", description: "Update your information" },
  { value: "banking", label: "Banking Information", description: "Bank account changes" },
  { value: "investment", label: "Investment Question", description: "Questions about your investments" },
  { value: "other", label: "Other", description: "General inquiries" },
];

export function CreateTicketForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const [isExpanded, setIsExpanded] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const createTicket = useMutation(
    trpc.tickets.createTicket.mutationOptions({
      onSuccess: (data) => {
        resetForm();
        router.push(`/support/${data.ticketId}`);
      },
    })
  );

  const resetForm = () => {
    setCategory("");
    setSubject("");
    setDescription("");
    setIsExpanded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subject || !description) return;

    createTicket.mutate({
      category: category as any,
      subject,
      description,
    });
  };

  const isValid = category && subject.trim() && description.trim();

  if (!isExpanded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => setIsExpanded(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create New Support Ticket
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Create Support Ticket
        </CardTitle>
        <CardDescription>
          Submit a request and our team will respond within 1-2 business days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">What do you need help with?</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div>
                      <span className="font-medium">{cat.label}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        - {cat.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief summary of your request"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please provide details about your request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/5000 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createTicket.isPending}
              className="flex-1"
            >
              {createTicket.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Ticket
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
