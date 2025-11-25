"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dealFormSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  teaserSummary: z.string().optional(),
  sector: z.string().optional(),
  geography: z.string().optional(),
  dealType: z.string().optional(),
  targetRaise: z.string().optional(),
  minInvestment: z.string().optional(),
  targetIrr: z.string().optional(),
  targetMoic: z.string().optional(),
  status: z.enum([
    "draft",
    "coming_soon",
    "live",
    "closing",
    "funded",
    "exited",
    "cancelled",
  ]),
  visibility: z.enum(["public", "accredited", "invite_only"]),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  launchDate: z.string().optional(),
  closeDate: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

type DealFormProps = {
  initialData?: Partial<DealFormValues>;
  onSubmit: (data: DealFormValues) => Promise<void>;
  isLoading?: boolean;
};

export function DealForm({ initialData, onSubmit, isLoading }: DealFormProps) {
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
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
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="project-alpha" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (auto-generated from name if empty)
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
                  <FormLabel>Teaser Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short summary for deal cards..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full deal description..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <Input placeholder="Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="geography"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geography</FormLabel>
                    <FormControl>
                      <Input placeholder="North America" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Equity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetRaise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Raise</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minInvestment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Investment</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetIrr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target IRR (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="15.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetMoic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target MOIC</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="closing">Closing</SelectItem>
                        <SelectItem value="funded">Funded</SelectItem>
                        <SelectItem value="exited">Exited</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="accredited">Accredited</SelectItem>
                        <SelectItem value="invite_only">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Launch Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Close Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Deal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

