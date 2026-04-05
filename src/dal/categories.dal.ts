import "server-only";

import { cache } from "react";

import { requireAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type { CategoryListRow, CategoryFormRow } from "@/types";

export const getCategoryById = cache(
  async (id: string): Promise<CategoryFormRow | null> => {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, title, slug, description, image, status, include_in_nav, sort_order",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data as CategoryFormRow | null;
  },
);

export const getCategories = cache(
  async (
    page: number,
    pageSize = 10,
  ): Promise<{ data: CategoryListRow[]; count: number }> => {
    await requireAdmin();
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;

    const { data, error, count } = await supabase
      .from("categories")
      .select("id, title, slug, status, include_in_nav, sort_order", {
        count: "exact",
      })
      .order("sort_order", { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data ?? []) as CategoryListRow[],
      count: count ?? 0,
    };
  },
);
