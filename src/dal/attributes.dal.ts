import "server-only";

import { cache } from "react";

import { requireAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type { AttributeForProductForm } from "@/types";

export const getAttributesWithOptionsForProductForm = cache(
  async (): Promise<AttributeForProductForm[]> => {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("attributes")
      .select(
        `
        id,
        attribute_name,
        sort_order,
        attribute_options (
          id,
          option_text,
          sort_order
        )
      `,
      )
      .order("sort_order", { ascending: true })
      .order("sort_order", {
        referencedTable: "attribute_options",
        ascending: true,
      });

    if (error) throw error;
    return (data ?? []) as AttributeForProductForm[];
  },
);
