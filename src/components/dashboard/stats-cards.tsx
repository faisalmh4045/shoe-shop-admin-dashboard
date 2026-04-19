import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock, PackageCheck } from "lucide-react";

interface CombinedStatsCardsProps {
  stats: {
    totalSales: number;
    thisMonthSales: number;
    pendingOrders: number;
    processingOrders: number;
    lastMonthSales: number;
  };
}

export function StatsCards({ stats }: CombinedStatsCardsProps) {
  return (
    <div className="grid h-full grid-cols-2 gap-2">
      <div className="col-span-2 flex items-center gap-3 rounded-md border border-border bg-card p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-chart-2/10">
          <DollarSign className="h-4 w-4 text-chart-2" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Total Revenue</span>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(stats.totalSales)}
          </span>
        </div>
      </div>

      <Card className="flex flex-col gap-1 rounded-md p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-1/10">
          <TrendingUp className="h-4 w-4 text-chart-1" />
        </div>
        <span className="mt-1 text-xs text-muted-foreground">
          This Month Sales
        </span>
        <span className="text-lg font-semibold text-foreground">
          {formatCurrency(stats.thisMonthSales)}
        </span>
      </Card>

      <Card className="flex flex-col gap-1 rounded-md p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-1/10">
          <TrendingUp className="h-4 w-4 text-chart-1" />
        </div>
        <span className="mt-1 text-xs text-muted-foreground">
          Last Month Sales
        </span>
        <span className="text-lg font-semibold text-foreground">
          {formatCurrency(stats.lastMonthSales)}
        </span>
      </Card>

      <Card className="flex flex-col gap-1 rounded-md p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-4/10">
          <Clock className="h-4 w-4 text-chart-4" />
        </div>
        <span className="mt-1 text-xs text-muted-foreground">
          Orders Pending
        </span>
        <span className="text-lg font-semibold text-foreground">
          {stats.pendingOrders}
        </span>
      </Card>

      <Card className="flex flex-col gap-1 rounded-md p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-5/10">
          <PackageCheck className="h-4 w-4 text-chart-5" />
        </div>
        <span className="mt-1 text-xs text-muted-foreground">Processing</span>
        <span className="text-lg font-semibold text-foreground">
          {stats.processingOrders}
        </span>
      </Card>
    </div>
  );
}
