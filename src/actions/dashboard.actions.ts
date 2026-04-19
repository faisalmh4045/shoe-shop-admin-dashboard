"use server";

import { getSalesChartData } from "@/dal/dashboard.dal";
import type { ChartDataPoint, Period } from "@/types";

export async function fetchChartData(
  period: Period,
): Promise<ChartDataPoint[]> {
  return getSalesChartData(period);
}
