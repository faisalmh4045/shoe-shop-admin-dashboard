"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

import { fetchChartData } from "@/actions/dashboard.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import type { Period } from "@/types";

const chartConfig = {
  sales: { label: "Sales ($)", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function SalesChart() {
  const [period, setPeriod] = useState<Period>("week");

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboard", "chart", period],
    queryFn: () => fetchChartData(period),
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-2">
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>
            Sales revenue and order count by {period}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {(["day", "week", "month", "year"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-75 items-center justify-center">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : isError ? (
          <div className="flex h-75 items-center justify-center">
            <span className="text-destructive">Failed to load chart data.</span>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-75 w-full">
            <LineChart
              accessibilityLayer
              data={data}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                yAxisId="left"
                type="linear"
                dataKey="sales"
                stroke="var(--color-sales)"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="linear"
                dataKey="orders"
                stroke="var(--color-orders)"
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
