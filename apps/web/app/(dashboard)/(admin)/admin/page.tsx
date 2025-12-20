import React, { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { authSession } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { InvestorsTable } from "./components/investors-table";
import { AdminsTable } from "./components/admins-table";

const AdminPage = async () => {
  const session = await authSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin (by role or email domain as fallback)
  const isAdmin =
    session.user.role === "admin" ||
    session.user.email?.endsWith("@darkalphacapital.com");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users and monitor system activity
        </p>
      </div>

      <Tabs defaultValue="investors" className="w-full">
        <TabsList>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
        </TabsList>

        <TabsContent value="investors" className="mt-6">
          <Suspense
            fallback={
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      Loading investors...
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <InvestorsTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <Suspense
            fallback={
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      Loading administrators...
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <AdminsTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
