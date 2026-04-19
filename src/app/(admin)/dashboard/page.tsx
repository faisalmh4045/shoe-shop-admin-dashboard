import { requireAdmin } from "@/dal/auth.dal";
import {
  getOrderStatusCounts,
  getRecentOrders,
  getSalesStats,
} from "@/dal/dashboard.dal";
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";

export default async function DashboardPage() {
  await requireAdmin();

  const [salesStats, orderCounts, recentOrders] = await Promise.all([
    getSalesStats(),
    getOrderStatusCounts(),
    getRecentOrders(10),
  ]);

  const stats = {
    totalSales: salesStats.allTimeSales,
    thisMonthSales: salesStats.thisMonthSales,
    lastMonthSales: salesStats.lastMonthSales,
    pendingOrders: orderCounts.pending,
    processingOrders: orderCounts.processing,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="lg:col-span-1">
          <StatsCards stats={stats} />
        </div>
      </div>
      <RecentOrdersTable orders={recentOrders} />
    </div>
  );
}
