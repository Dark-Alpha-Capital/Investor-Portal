"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createDealSchema } from "@/lib/schemas/create-deal-schema";

type DealFormValues = z.infer<typeof createDealSchema>;

type DealFormProps = {
  initialData?: Partial<DealFormValues>;
  dealId?: string; // If provided, form will update instead of create
};

export function DealForm({ initialData, dealId }: DealFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const trpc = useTRPC();

  const isUpdateMode = !!dealId;

  const { mutate: createDeal, isPending: isCreating } = useMutation(
    trpc.deals.create.mutationOptions({
      onSuccess: (data) => {
        const newDeal = data.deal;
        toast.success("Deal created successfully");
        router.push(`/admin/deals/${newDeal.id}`);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to create deal");
      },
    })
  );

  const { mutate: updateDeal, isPending: isUpdating } = useMutation(
    trpc.deals.update.mutationOptions({
      onSuccess: (data) => {
        const newDeal = data.deal;
        toast.success("Deal updated successfully");
        router.push(`/admin/deals/${newDeal.id}`);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to update deal");
      },
    })
  );

  const isPending = isCreating || isUpdating;

  const form = useForm<DealFormValues>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      teaserSummary: initialData?.teaserSummary || "",
      sector: initialData?.sector || "",
      geography: initialData?.geography || "",
      dealType: initialData?.dealType || "",
      targetRaise: initialData?.targetRaise || "",
      minInvestment: initialData?.minInvestment || "",
      targetIrr: initialData?.targetIrr || "",
      targetMoic: initialData?.targetMoic || "",
      status: initialData?.status || "draft",
      visibility: initialData?.visibility || "invite_only",
      coverImageUrl: initialData?.coverImageUrl || "",
      launchDate: initialData?.launchDate
        ? new Date(initialData.launchDate).toISOString().split("T")[0]
        : "",
      closeDate: initialData?.closeDate
        ? new Date(initialData.closeDate).toISOString().split("T")[0]
        : "",
    },
  });

  const handleSubmit = async (data: DealFormValues) => {
    if (isUpdateMode && dealId) {
      updateDeal({ ...data, dealId });
    } else {
      createDeal(data);
    }
  };

  const handleInvalid = () => {
    // Find the first tab with errors and switch to it
    const errors = form.formState.errors;
    const tabs = [
      { key: "basic", fields: ["name", "description", "teaserSummary"] },
      { key: "categorization", fields: ["sector", "geography", "dealType"] },
      {
        key: "financial",
        fields: ["targetRaise", "minInvestment", "targetIrr", "targetMoic"],
      },
      {
        key: "settings",
        fields: [
          "status",
          "visibility",
          "coverImageUrl",
          "launchDate",
          "closeDate",
        ],
      },
    ];

    for (const tab of tabs) {
      const hasError = tab.fields.some(
        (field) => errors[field as keyof typeof errors]
      );
      if (hasError) {
        setActiveTab(tab.key);
        const tabName =
          tab.key === "basic"
            ? "Basic Info"
            : tab.key === "categorization"
              ? "Categorization"
              : tab.key === "financial"
                ? "Financial"
                : "Settings";
        toast.error(`Please fill in all required fields in the ${tabName} tab`);
        return;
      }
    }

    toast.error("Please fill in all required fields");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
        className="space-y-6"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="categorization">Categorization</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Project Alpha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teaserSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teaser Summary *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Short summary for deal cards..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Brief summary displayed on deal cards and listings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full deal description..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comprehensive description of the deal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categorization Tab */}
          <TabsContent value="categorization" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector *</FormLabel>
                        <FormControl>
                          <Input placeholder="Technology" {...field} />
                        </FormControl>
                        <FormDescription>
                          Industry sector (e.g., Technology, Healthcare, Real
                          Estate)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="geography"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geography *</FormLabel>
                        <FormControl>
                          <Input placeholder="North America" {...field} />
                        </FormControl>
                        <FormDescription>
                          Geographic region or market
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dealType"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Deal Type *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Equity, Debt, Real Estate, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Type of investment deal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Details Tab */}
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetRaise"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Raise *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000000"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Total amount to be raised (in USD)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minInvestment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Investment *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50000" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum investment amount required (in USD)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetIrr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target IRR (%) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="15.5"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Target Internal Rate of Return percentage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetMoic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target MOIC *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="2.5"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Target Multiple on Invested Capital
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status & Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="coming_soon">
                              Coming Soon
                            </SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="closing">Closing</SelectItem>
                            <SelectItem value="funded">Funded</SelectItem>
                            <SelectItem value="exited">Exited</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Current status of the deal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="accredited">
                              Accredited
                            </SelectItem>
                            <SelectItem value="invite_only">
                              Invite Only
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Who can view this deal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL to the cover image for this deal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="launchDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Launch Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          When the deal will be launched
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closeDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Close Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Expected closing date for the deal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {activeTab !== "basic" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = [
                    "basic",
                    "categorization",
                    "financial",
                    "settings",
                  ];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    const prevTab = tabs[currentIndex - 1];
                    if (prevTab) setActiveTab(prevTab);
                  }
                }}
              >
                Previous
              </Button>
            )}
            {activeTab !== "settings" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = [
                    "basic",
                    "categorization",
                    "financial",
                    "settings",
                  ];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    const nextTab = tabs[currentIndex + 1];
                    if (nextTab) setActiveTab(nextTab);
                  }
                }}
              >
                Next
              </Button>
            )}
          </div>
          <Button type="submit" disabled={isPending} size="lg">
            {isPending
              ? isUpdateMode
                ? "Updating Deal..."
                : "Creating Deal..."
              : isUpdateMode
                ? "Update Deal"
                : "Create Deal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
