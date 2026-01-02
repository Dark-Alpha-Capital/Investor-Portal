"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

const CATEGORIES = [
  { value: "credentials", label: "Login/Credentials" },
  { value: "documents", label: "Documents" },
  { value: "profile", label: "Profile Update" },
  { value: "banking", label: "Banking Information" },
  { value: "investment", label: "Investment Question" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function CreateTicketDialog() {
  const router = useRouter();
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  // Form state
  const [investorSearch, setInvestorSearch] = useState("");
  const [selectedInvestor, setSelectedInvestor] = useState<{
    id: string;
    name: string | null;
    email: string;
  } | null>(null);
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // Debounce search
  const [debouncedSearch] = useDebounce(investorSearch, 300);

  // Search investors
  const { data: investors, isLoading: isSearching } = useQuery({
    ...trpc.tickets.searchInvestors.queryOptions({
      search: debouncedSearch,
    }),
    enabled: debouncedSearch.length >= 2,
  });

  // Create ticket mutation
  const createTicket = useMutation(
    trpc.tickets.createTicketForInvestor.mutationOptions({
      onSuccess: (data) => {
        setOpen(false);
        resetForm();
        router.push(`/admin/tickets/${data.ticketId}`);
      },
    })
  );

  const resetForm = () => {
    setInvestorSearch("");
    setSelectedInvestor(null);
    setCategory("");
    setPriority("medium");
    setSubject("");
    setDescription("");
  };

  const handleSubmit = () => {
    if (!selectedInvestor || !category || !subject || !description) return;

    createTicket.mutate({
      investorId: selectedInvestor.id,
      category: category as any,
      priority: priority as any,
      subject,
      description,
    });
  };

  const isValid = selectedInvestor && category && subject && description;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Ticket for Investor</DialogTitle>
          <DialogDescription>
            Create a support ticket on behalf of an investor (e.g., from a phone call or email).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Investor Search */}
          <div className="grid gap-2">
            <Label htmlFor="investor">Investor</Label>
            {selectedInvestor ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{selectedInvestor.name || "No Name"}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvestor.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedInvestor(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="investor"
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={investorSearch}
                  onChange={(e) => setInvestorSearch(e.target.value)}
                />
                {debouncedSearch.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-[200px] overflow-auto">
                    {isSearching ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        Searching...
                      </div>
                    ) : investors && investors.length > 0 ? (
                      investors.map((investor) => (
                        <button
                          key={investor.id}
                          className="w-full p-3 text-left hover:bg-muted transition-colors"
                          onClick={() => {
                            setSelectedInvestor(investor);
                            setInvestorSearch("");
                          }}
                        >
                          <p className="font-medium">{investor.name || "No Name"}</p>
                          <p className="text-sm text-muted-foreground">{investor.email}</p>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No investors found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief summary of the issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue or request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createTicket.isPending}
          >
            {createTicket.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
