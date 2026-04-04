import "server-only";

import { cache } from "react";

import { requireAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type { Category, ProductListRow } from "@/types";

function normalizeCategoryTitle(
  embedded: Pick<Category, "title"> | Pick<Category, "title">[] | null,
): Pick<Category, "title"> | null {
  if (embedded == null) return null;
  if (Array.isArray(embedded)) return embedded[0] ?? null;
  return embedded;
}

export const getProducts = cache(
  async (
    page: number,
    pageSize = 10,
  ): Promise<{ data: ProductListRow[]; count: number }> => {
    await requireAdmin();
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;

    const {
      data: raw,
      error,
      count,
    } = await supabase
      .from("products")
      .select(
        `
        id,
        title,
        sku,
        status,
        price,
        quantity,
        categories ( title ),
        images:product_images (
          image_url,
          sort_order
        )
      `,
        { count: "exact" },
      )
      .order("sort_order", {
        ascending: true,
        referencedTable: "product_images",
      })
      .limit(1, { referencedTable: "product_images" })
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const data: ProductListRow[] = (raw ?? []).map((row) => {
      const { categories, images, ...rest } = row;
      return {
        ...rest,
        categories: normalizeCategoryTitle(categories),
        thumbnail_url: images?.[0]?.image_url ?? null,
      };
    });

    return {
      data,
      count: count ?? 0,
    };
  },
);
