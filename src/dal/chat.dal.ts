import "server-only";

import { cache } from "react";

import { requireAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type {
  ChatPeriod,
  DeadInventoryResult,
  LowStockProductResult,
  NewCustomersResult,
  OrderComparisonResult,
  OrderDetailsResult,
  RevenueStatsResult,
  SalesByDayResult,
  SearchOrderResult,
} from "@/types";

function periodStart(period: ChatPeriod): Date {
  const now = new Date();
  const start = new Date(now);

  if (period === "day") start.setDate(now.getDate() - 1);
  if (period === "week") start.setDate(now.getDate() - 7);
  if (period === "month") start.setMonth(now.getMonth() - 1);
  if (period === "year") start.setFullYear(now.getFullYear() - 1);

  return start;
}

function previousPeriodStart(period: ChatPeriod): Date {
  const end = periodStart(period);
  const start = new Date(end);

  if (period === "day") start.setDate(end.getDate() - 1);
  if (period === "week") start.setDate(end.getDate() - 7);
  if (period === "month") start.setMonth(end.getMonth() - 1);
  if (period === "year") start.setFullYear(end.getFullYear() - 1);

  return start;
}

function toDeltaPercentage(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export const getOrderComparison = cache(
  async (period: ChatPeriod): Promise<OrderComparisonResult> => {
    await requireAdmin();
    const supabase = await createClient();

    const start = periodStart(period).toISOString();
    const previousStart = previousPeriodStart(period).toISOString();

    const [
      { count: currentCount, error: currentError },
      { count: prevCount, error: prevError },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("placed_at", start),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("placed_at", previousStart)
        .lt("placed_at", start),
    ]);

    if (currentError) throw currentError;
    if (prevError) throw prevError;

    const current = currentCount ?? 0;
    const previous = prevCount ?? 0;

    return {
      period,
      currentOrderCount: current,
      previousOrderCount: previous,
      delta: current - previous,
      deltaPercentage: toDeltaPercentage(current, previous),
    };
  },
);

export const getRevenueStats = cache(
  async (period: ChatPeriod): Promise<RevenueStatsResult> => {
    await requireAdmin();
    const supabase = await createClient();

    const start = periodStart(period).toISOString();
    const previousStart = previousPeriodStart(period).toISOString();

    const [
      { data: currentRows, error: currentError },
      { data: previousRows, error: previousError },
    ] = await Promise.all([
      supabase.from("orders").select("total").gte("placed_at", start),
      supabase
        .from("orders")
        .select("total")
        .gte("placed_at", previousStart)
        .lt("placed_at", start),
    ]);

    if (currentError) throw currentError;
    if (previousError) throw previousError;

    const currentRevenue = (currentRows ?? []).reduce(
      (sum, row) => sum + row.total,
      0,
    );
    const previousRevenue = (previousRows ?? []).reduce(
      (sum, row) => sum + row.total,
      0,
    );

    return {
      period,
      currentRevenue,
      previousRevenue,
      delta: currentRevenue - previousRevenue,
      deltaPercentage: toDeltaPercentage(currentRevenue, previousRevenue),
    };
  },
);

export const getLowStockProducts = cache(
  async (threshold: number): Promise<LowStockProductResult[]> => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("id, title, sku, quantity, updated_at")
      .lte("quantity", threshold)
      .order("quantity", { ascending: true })
      .limit(20);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      productId: row.id,
      title: row.title,
      sku: row.sku,
      quantity: row.quantity,
      updatedAt: row.updated_at,
    }));
  },
);

export const searchOrders = cache(
  async (query: string): Promise<SearchOrderResult[]> => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select("id, email, total, order_status, placed_at")
      .eq("email", query)
      .order("placed_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      orderId: row.id,
      email: row.email,
      total: row.total,
      status: row.order_status,
      placedAt: row.placed_at,
    }));
  },
);

export const getOrderDetails = cache(
  async (orderId: string): Promise<OrderDetailsResult | null> => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id, email, total, order_status, placed_at,
        order_items(product_id, title, sku, quantity, subtotal)
      `,
      )
      .eq("order_number", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw error;
    }

    return {
      orderId: data.id,
      email: data.email,
      total: data.total,
      status: data.order_status,
      placedAt: data.placed_at,
      items: (data.order_items ?? []).map((item) => ({
        productId: item.product_id,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
    };
  },
);

export const getNewCustomers = cache(
  async (period: ChatPeriod): Promise<NewCustomersResult> => {
    await requireAdmin();
    const supabase = await createClient();

    const start = periodStart(period).toISOString();
    const previousStart = previousPeriodStart(period).toISOString();

    const [{ count: current, error: e1 }, { count: previous, error: e2 }] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start),
        supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .gte("created_at", previousStart)
          .lt("created_at", start),
      ]);

    if (e1) throw e1;
    if (e2) throw e2;

    const cur = current ?? 0;
    const prev = previous ?? 0;

    return {
      period,
      newCustomers: cur,
      previousNewCustomers: prev,
      delta: cur - prev,
      deltaPercentage: toDeltaPercentage(cur, prev),
    };
  },
);

export const getDeadInventory = cache(
  async (period: ChatPeriod): Promise<DeadInventoryResult[]> => {
    await requireAdmin();
    const supabase = await createClient();

    const start = periodStart(period).toISOString();

    // Products that had at least one sale in the period
    const { data: soldItems, error: e1 } = await supabase
      .from("order_items")
      .select("product_id, orders!inner(placed_at)")
      .gte("orders.placed_at", start);

    if (e1) throw e1;

    const soldIds = new Set((soldItems ?? []).map((r) => r.product_id));

    // All active products
    const { data: products, error: e2 } = await supabase
      .from("products")
      .select("id, title, sku, quantity");

    if (e2) throw e2;

    return (products ?? [])
      .filter((p) => !soldIds.has(p.id))
      .map((p) => ({
        productId: p.id,
        title: p.title,
        sku: p.sku,
        stockQuantity: p.quantity,
      }));
  },
);

export const getSalesByDayOfWeek = cache(
  async (period: ChatPeriod): Promise<SalesByDayResult[]> => {
    await requireAdmin();
    const supabase = await createClient();

    const start = periodStart(period).toISOString();

    const { data, error } = await supabase
      .from("orders")
      .select("total, placed_at")
      .gte("placed_at", start);

    if (error) throw error;

    const DAYS = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const grouped = Array.from({ length: 7 }, (_, i) => ({
      day: DAYS[i],
      orderCount: 0,
      revenue: 0,
    }));

    for (const row of data ?? []) {
      const dow = new Date(row.placed_at).getDay();
      grouped[dow].orderCount += 1;
      grouped[dow].revenue += row.total;
    }

    return grouped;
  },
);
