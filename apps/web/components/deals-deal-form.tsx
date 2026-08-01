
import React, { useState } from "react";
import { useRouter } from "@/hooks/use-app-navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
        const dealId = (data.deal as { id: string } | null)?.id;
        if (!dealId) {
          toast.error("Failed to create deal: Invalid response");
          return;
        }
        toast.success("Deal created successfully");
        router.push(`/admin/deals/${dealId}`);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to create deal");
      },
    }),
  );

  const { mutate: updateDeal, isPending: isUpdating } = useMutation(
    trpc.deals.update.mutationOptions({
      onSuccess: (data) => {
        const dealId = (data.deal as { id: string } | null)?.id;
        if (!dealId) {
          toast.error("Failed to update deal: Invalid response");
          return;
        }
        toast.success("Deal updated successfully");
        router.push(`/admin/deals/${dealId}`);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to update deal");
      },
    }),
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
      status: (initialData?.status as DealFormValues["status"]) || "draft",
      coverImageUrl: initialData?.coverImageUrl || "",
      launchDate: initialData?.launchDate
        ? new Date(initialData.launchDate).toISOString().split("T")[0]
        : "",
      closeDate: initialData?.closeDate
        ? new Date(initialData.closeDate).toISOString().split("T")[0]
        : "",
      targetCompany: initialData?.targetCompany || "",
      revenue: initialData?.revenue || "",
      ebitda: initialData?.ebitda || "",
      holdPeriod: initialData?.holdPeriod || "",
      investmentThesis: initialData?.investmentThesis || "",
      risks: initialData?.risks || "",
      purchasePrice: initialData?.purchasePrice || "",
      debt: initialData?.debt || "",
      sponsorEquity: initialData?.sponsorEquity || "",
      lpEquity: initialData?.lpEquity || "",
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
      {
        key: "basic",
        fields: ["name", "description", "teaserSummary", "targetCompany"],
        label: "Basic Info",
      },
      {
        key: "categorization",
        fields: ["sector", "geography", "dealType"],
        label: "Categorization",
      },
      {
        key: "financial",
        fields: [
          "targetRaise",
          "minInvestment",
          "targetIrr",
          "targetMoic",
          "revenue",
          "ebitda",
          "holdPeriod",
          "purchasePrice",
          "debt",
          "sponsorEquity",
          "lpEquity",
        ],
        label: "Financial",
      },
      {
        key: "thesis",
        fields: ["investmentThesis", "risks"],
        label: "Thesis & Risks",
      },
      {
        key: "settings",
        fields: [
          "status",
          "coverImageUrl",
          "launchDate",
          "closeDate",
        ],
        label: "Settings",
      },
    ];

    for (const tab of tabs) {
      const hasError = tab.fields.some(
        (field) => errors[field as keyof typeof errors],
      );
      if (hasError) {
        setActiveTab(tab.key);
        toast.error(`Please fill in all required fields in the ${tab.label} tab`);
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
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="categorization">Categorization</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="thesis">Thesis & Risks</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4">
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
                name="targetCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Healthcare Inc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Name of the target company
                    </FormDescription>
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
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Full deal description..."
                      />
                    </FormControl>
                    <FormDescription>
                      Comprehensive description of the deal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Categorization Tab */}
          <TabsContent value="categorization" className="space-y-4">
            <div className="space-y-4">
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
                      <FormDescription>Type of investment deal</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* Financial Details Tab */}
          <TabsContent value="financial" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetRaise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Raise *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000000" {...field} />
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

                <FormField
                  control={form.control}
                  name="revenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="25000000" {...field} />
                      </FormControl>
                      <FormDescription>LTM / latest revenue (USD)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ebitda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EBITDA</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="7500000" {...field} />
                      </FormControl>
                      <FormDescription>LTM / latest EBITDA (USD)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="holdPeriod"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Expected Hold Period</FormLabel>
                      <FormControl>
                        <Input placeholder="3–5 years" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3">Capital Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="45000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="debt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Debt</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="25000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sponsorEquity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sponsor Equity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lpEquity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LP Equity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Thesis & Risks Tab */}
          <TabsContent value="thesis" className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="investmentThesis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Thesis</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Why are we buying? Why now? What is attractive?"
                      />
                    </FormControl>
                    <FormDescription>
                      Explain the investment rationale for institutional investors
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risks</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Customer concentration, key employee dependency, integration risk..."
                      />
                    </FormControl>
                    <FormDescription>
                      Key risks investors should understand
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Status & Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
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
            </div>
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
