"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  try {
    const { permitted } = await requireSuperAdmin();
    if (!permitted) {
      return { success: false, error: "Insufficient permissions." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/categories");
    return { success: true, data: null };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}
