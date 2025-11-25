"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DealForm } from "../components/deal-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewDealPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Deal created successfully");
        router.push("/admin/deals");
      } else {
        toast.error(result.message || "Failed to create deal");
      }
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create deal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Deal</h1>
        <p className="text-muted-foreground mt-2">
          Add a new investment deal to the platform
        </p>
      </div>

      <DealForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}

