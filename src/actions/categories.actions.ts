"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import { CreateCategorySchema } from "@/validations/category.validations";

export async function createCategory(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { permitted } = await requireSuperAdmin();
    if (!permitted) {
      return { success: false, error: "Insufficient permissions." };
    }

    const parsed = CreateCategorySchema.safeParse(
      Object.fromEntries(formData.entries()),
    );
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data.",
      };
    }

    const {
      title,
      slug,
      description,
      image,
      status,
      include_in_nav,
      sort_order,
    } = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .insert({
        title,
        slug,
        description: description === "" ? null : description,
        image: image ?? null,
        status,
        include_in_nav,
        sort_order,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/categories");
    return { success: true, data: { id: data.id } };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateCategory(
  id: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const { permitted } = await requireSuperAdmin();
    if (!permitted) {
      return { success: false, error: "Insufficient permissions." };
    }

    const parsed = CreateCategorySchema.safeParse(
      Object.fromEntries(formData.entries()),
    );
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data.",
      };
    }

    const {
      title,
      slug,
      description,
      image,
      status,
      include_in_nav,
      sort_order,
    } = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .update({
        title,
        slug,
        description: description === "" ? null : description,
        image: image ?? null,
        status,
        include_in_nav,
        sort_order,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data) {
      return {
        success: false,
        error: "Category could not be updated or was not found.",
      };
    }

    revalidatePath("/categories");
    revalidatePath(`/categories/${id}/edit`);
    return { success: true, data: null };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

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
