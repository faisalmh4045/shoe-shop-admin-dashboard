"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import { CreateSimpleProductSchema } from "@/validations/product.validations";

/** JSON arrays in FormData: `images_json`, `attributeSelections_json`. */
export async function createProduct(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { permitted } = await requireSuperAdmin();
    if (!permitted) {
      return { success: false, error: "Insufficient permissions." };
    }

    let imagesJson: unknown = [];
    let attributeSelectionsJson: unknown = [];
    try {
      const rawImages = formData.get("images_json");
      imagesJson =
        rawImages == null || rawImages === ""
          ? []
          : JSON.parse(String(rawImages));
    } catch {
      return { success: false, error: "Invalid images data." };
    }
    try {
      const rawAttrs = formData.get("attributeSelections_json");
      attributeSelectionsJson =
        rawAttrs == null || rawAttrs === "" ? [] : JSON.parse(String(rawAttrs));
    } catch {
      return { success: false, error: "Invalid attribute selections." };
    }

    const parsed = CreateSimpleProductSchema.safeParse({
      title: formData.get("title"),
      category_id: formData.get("category_id"),
      short_description: formData.get("short_description"),
      description: formData.get("description"),
      sku: formData.get("sku"),
      price: formData.get("price"),
      quantity: formData.get("quantity"),
      status: formData.get("status"),
      visibility: formData.get("visibility"),
      images: imagesJson,
      attributeSelections: attributeSelectionsJson,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data.",
      };
    }

    const {
      title,
      category_id,
      short_description,
      description,
      sku,
      price,
      quantity,
      status,
      visibility,
      images: imageUrls,
      attributeSelections,
    } = parsed.data;

    const supabase = await createClient();

    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        type: "SIMPLE",
        title,
        category_id,
        short_description: short_description === "" ? null : short_description,
        description: description === "" ? null : description,
        sku,
        price,
        quantity,
        status,
        visibility,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    const productId = product.id;

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((image_url, index) => ({
        product_id: productId,
        image_url,
        sort_order: index,
      }));
      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(imageRows);
      if (imagesError) {
        await supabase.from("products").delete().eq("id", productId);
        return { success: false, error: imagesError.message };
      }
    }

    if (attributeSelections.length > 0) {
      const attrRows = attributeSelections.map((row) => ({
        product_id: productId,
        attribute_id: row.attribute_id,
        option_id: row.option_id,
      }));
      const { error: attrError } = await supabase
        .from("product_attribute_values")
        .insert(attrRows);
      if (attrError) {
        await supabase.from("products").delete().eq("id", productId);
        return { success: false, error: attrError.message };
      }
    }

    revalidatePath("/products");
    return { success: true, data: { id: productId } };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}
