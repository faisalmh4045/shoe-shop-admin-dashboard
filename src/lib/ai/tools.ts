import { tool } from "ai";
import { z } from "zod";

import {
  getDeadInventory,
  getLowStockProducts,
  getNewCustomers,
  getOrderComparison,
  getOrderDetails,
  getRevenueStats,
  getSalesByDayOfWeek,
  searchOrders,
} from "@/dal/chat.dal";

const periodSchema = z.enum(["day", "week", "month", "year"]);

export const chatTools = {
  getOrderComparison: tool({
    description: "Compare order volume in current vs previous period.",
    inputSchema: z.object({
      period: periodSchema.default("month"),
    }),
    execute: async ({ period }) => getOrderComparison(period),
  }),

  getRevenueStats: tool({
    description: "Compare revenue in current vs previous period.",
    inputSchema: z.object({
      period: periodSchema.default("month"),
    }),
    execute: async ({ period }) => getRevenueStats(period),
  }),

  getLowStockProducts: tool({
    description: "Get products at or below low stock threshold.",
    inputSchema: z.object({
      threshold: z.number().int().min(0).default(10),
    }),
    execute: async ({ threshold }) => getLowStockProducts(threshold),
  }),

  searchOrders: tool({
    description:
      "Search orders by customer email or order ID. Use when the user asks about a specific customer or order.",
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe("Email address or order ID to search for"),
    }),
    execute: async ({ query }) => searchOrders(query),
  }),

  getOrderDetails: tool({
    description:
      "Get full details of a single order including all line items. Use when the user asks to see or look up a specific order.",
    inputSchema: z.object({
      orderId: z.string().describe("The order ID to retrieve"),
    }),
    execute: async ({ orderId }) => getOrderDetails(orderId),
  }),

  getNewCustomers: tool({
    description:
      "Get new customer acquisition count and compare to previous period.",
    inputSchema: z.object({
      period: periodSchema.default("month"),
    }),
    execute: async ({ period }) => getNewCustomers(period),
  }),

  getDeadInventory: tool({
    description:
      "Get products that had zero sales in the selected period. Useful for identifying slow or dead stock.",
    inputSchema: z.object({
      period: periodSchema.default("month"),
    }),
    execute: async ({ period }) => getDeadInventory(period),
  }),

  getSalesByDayOfWeek: tool({
    description:
      "Get order count and revenue grouped by day of the week. Useful for spotting weekly patterns.",
    inputSchema: z.object({
      period: periodSchema.default("month"),
    }),
    execute: async ({ period }) => getSalesByDayOfWeek(period),
  }),
};
