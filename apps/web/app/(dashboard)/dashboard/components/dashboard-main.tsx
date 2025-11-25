import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function DashboardMain() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your investor portal
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">KYC Status</h3>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your KYC verification has been completed successfully.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Investment Opportunities</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse available investment opportunities
            </p>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Active deals</p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Portfolio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View your investment portfolio
            </p>
            <p className="text-2xl font-bold">$0</p>
            <p className="text-xs text-muted-foreground">Total invested</p>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity to display</p>
          </div>
        </Card>
      </div>
    </div>
  );
}



