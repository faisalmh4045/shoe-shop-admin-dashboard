import "server-only";

import { cache } from "react";

import { requireAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type {
  ChartDataPoint,
  DashboardOrder,
  OrderStatusCounts,
  SalesStats,
  Period,
} from "@/types";

export const getSalesChartData = cache(
  async (period: Period): Promise<ChartDataPoint[]> => {
    await requireAdmin();
    const supabase = await createClient();

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 6,
        );
        break;
      case "week":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 28,
        );
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear() - 5, 0, 1);
        break;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("placed_at, total")
      .gte("placed_at", startDate.toISOString())
      .order("placed_at", { ascending: true });

    if (error) throw error;

    const grouped = new Map<string, { sales: number; orders: number }>();

    for (const order of data ?? []) {
      const date = new Date(order.placed_at);
      let key: string;

      switch (period) {
        case "day":
        case "week":
          key = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          break;
        case "month":
          key = date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
          break;
        case "year":
          key = date.getFullYear().toString();
          break;
      }

      const existing = grouped.get(key) ?? { sales: 0, orders: 0 };
      grouped.set(key, {
        sales: existing.sales + (order.total ?? 0),
        orders: existing.orders + 1,
      });
    }

    return Array.from(grouped.entries()).map(([label, point]) => ({
      label,
      sales: point.sales,
      orders: point.orders,
    }));
  },
);

export const getSalesStats = cache(async (): Promise<SalesStats> => {
  await requireAdmin();
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    0,
    23,
    59,
    59,
  );

  const [
    { data: thisMonthData },
    { data: lastMonthData },
    { data: allTimeData },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .gte("placed_at", thisMonth.toISOString()),
    supabase
      .from("orders")
      .select("total")
      .gte("placed_at", lastMonth.toISOString())
      .lte("placed_at", lastMonthEnd.toISOString()),
    supabase.from("orders").select("total"),
  ]);

  return {
    thisMonthSales:
      thisMonthData?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0,
    lastMonthSales:
      lastMonthData?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0,
    allTimeSales: allTimeData?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0,
  };
});

export const getOrderStatusCounts = cache(
  async (): Promise<OrderStatusCounts> => {
    await requireAdmin();
    const supabase = await createClient();

    const [{ count: pending }, { count: processing }] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("order_status", "NEW"),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("order_status", "PROCESSING"),
    ]);

    return {
      pending: pending ?? 0,
      processing: processing ?? 0,
    };
  },
);

export const getRecentOrders = cache(
  async (limit = 10): Promise<DashboardOrder[]> => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, placed_at, email, payment_method, order_status, total",
      )
      .order("placed_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data ?? [];
  },
);
