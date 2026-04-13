"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import {
  CreateProductSchema,
  CreateVariantGroupSchema,
  UpdateProductSchema,
  UpdateVariantFormSchema,
  VariantFormSchema,
  variantAttributeOptionSetKey,
} from "@/validations/product.validations";

/** JSON arrays in FormData: `images_json`, `attributeSelections_json`, `variantGroupAttributeIds_json`. */
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
    let variantGroupAttributeIdsJson: unknown = [];
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
    try {
      const rawVg = formData.get("variantGroupAttributeIds_json");
      variantGroupAttributeIdsJson =
        rawVg == null || rawVg === "" ? [] : JSON.parse(String(rawVg));
    } catch {
      return { success: false, error: "Invalid variant attribute selection." };
    }

    const typeRaw = formData.get("type");
    const type =
      typeRaw === "CONFIGURABLE"
        ? ("CONFIGURABLE" as const)
        : ("SIMPLE" as const);

    const parsed = CreateProductSchema.safeParse(
      type === "SIMPLE"
        ? {
            type,
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
          }
        : {
            type,
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
            variantGroupAttributeIds: variantGroupAttributeIdsJson,
          },
    );

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
    } = parsed.data;

    const attributeSelections =
      parsed.data.type === "SIMPLE" ? parsed.data.attributeSelections : [];

    const supabase = await createClient();

    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        type: parsed.data.type,
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
      const imageRows = imageUrls.map((image_url: string, index: number) => ({
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
      const attrRows = attributeSelections.map(
        (row: { attribute_id: string; option_id: string }) => ({
          product_id: productId,
          attribute_id: row.attribute_id,
          option_id: row.option_id,
        }),
      );
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

export async function createVariantGroup(
  formData: FormData,
): Promise<ActionResult<{ variantGroupId: string }>> {
  try {
    const { permitted } = await requireSuperAdmin();
    if (!permitted) {
      return { success: false, error: "Insufficient permissions." };
    }

    let attributeIdsJson: unknown = [];
    try {
      const raw = formData.get("attribute_ids_json");
      attributeIdsJson =
        raw == null || raw === "" ? [] : JSON.parse(String(raw));
    } catch {
      return { success: false, error: "Invalid attribute list." };
    }

    const parsed = CreateVariantGroupSchema.safeParse({
      product_id: formData.get("product_id"),
      attribute_ids: attributeIdsJson,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data.",
      };
    }

    const { product_id, attribute_ids } = parsed.data;

    const supabase = await createClient();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, type")
      .eq("id", product_id)
      .maybeSingle();

    if (productError) {
      return { success: false, error: productError.message };
    }
    if (!product) {
      return { success: false, error: "Product not found." };
    }
    if (product.type !== "CONFIGURABLE") {
      return {
        success: false,
        error: "Variant groups can only be created for configurable products.",
      };
    }

    const { data: existingGroup, error: groupLookupError } = await supabase
      .from("variant_groups")
      .select("id")
      .eq("product_id", product_id)
      .maybeSingle();

    if (groupLookupError) {
      return { success: false, error: groupLookupError.message };
    }
    if (existingGroup) {
      return {
        success: false,
        error: "This product already has a variant group.",
      };
    }

    const { data: group, error: groupInsertError } = await supabase
      .from("variant_groups")
      .insert({ product_id })
      .select("id")
      .single();

    if (groupInsertError) {
      return { success: false, error: groupInsertError.message };
    }

    const variantGroupId = group.id;

    const junctionRows = attribute_ids.map((attribute_id, index) => ({
      variant_group_id: variantGroupId,
      attribute_id,
      sort_order: index,
    }));

    const { error: junctionError } = await supabase
      .from("variant_group_attributes")
      .insert(junctionRows);

    if (junctionError) {
      await supabase.from("variant_groups").delete().eq("id", variantGroupId);
      return { success: false, error: junctionError.message };
    }

    revalidatePath("/products");
    revalidatePath(`/products/${product_id}/edit`);
    return { success: true, data: { variantGroupId } };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateProduct(
  formData: FormData,
): Promise<ActionResult<null>> {
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

    const parsed = UpdateProductSchema.safeParse({
      product_id: formData.get("product_id"),
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
      product_id,
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

    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("id, type")
      .eq("id", product_id)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: existingError.message };
    }
    if (!existing) {
      return { success: false, error: "Product not found." };
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
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
      .eq("id", product_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: deleteImagesError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", product_id);

    if (deleteImagesError) {
      return { success: false, error: deleteImagesError.message };
    }

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((image_url: string, index: number) => ({
        product_id,
        image_url,
        sort_order: index,
      }));
      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(imageRows);
      if (imagesError) {
        return { success: false, error: imagesError.message };
      }
    }

    if (existing.type === "SIMPLE") {
      const { error: deleteAttrError } = await supabase
        .from("product_attribute_values")
        .delete()
        .eq("product_id", product_id);

      if (deleteAttrError) {
        return { success: false, error: deleteAttrError.message };
      }

      if (attributeSelections.length > 0) {
        const attrRows = attributeSelections.map(
          (row: { attribute_id: string; option_id: string }) => ({
            product_id,
            attribute_id: row.attribute_id,
            option_id: row.option_id,
          }),
        );
        const { error: attrError } = await supabase
          .from("product_attribute_values")
          .insert(attrRows);
        if (attrError) {
          return { success: false, error: attrError.message };
        }
      }
    }

    revalidatePath("/products");
    revalidatePath(`/products/${product_id}/edit`);
    return { success: true, data: null };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

type SiblingVariantRow = {
  id: string;
  variant_attribute_values:
    | { attribute_id: string; option_id: string | null }[]
    | null;
};

async function loadSiblingOptionSetKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
  variantGroupId: string,
  excludeVariantId: string | null,
): Promise<
  { ok: true; keys: Map<string, string> } | { ok: false; message: string }
> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, variant_attribute_values ( attribute_id, option_id )")
    .eq("variant_group_id", variantGroupId);

  if (error) {
    return { ok: false, message: error.message };
  }

  const keys = new Map<string, string>();
  for (const row of (data ?? []) as SiblingVariantRow[]) {
    if (excludeVariantId != null && row.id === excludeVariantId) continue;
    const pairs = (row.variant_attribute_values ?? [])
      .filter(
        (v): v is { attribute_id: string; option_id: string } =>
          v.option_id != null,
      )
      .map((v) => ({ attribute_id: v.attribute_id, option_id: v.option_id }));
    if (pairs.length === 0) continue;
    keys.set(row.id, variantAttributeOptionSetKey(pairs));
  }
  return { ok: true, keys };
}

export async function createVariant(
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
      const raw = formData.get("attribute_selections_json");
      attributeSelectionsJson =
        raw == null || raw === "" ? [] : JSON.parse(String(raw));
    } catch {
      return { success: false, error: "Invalid attribute options." };
    }

    const parsed = VariantFormSchema.safeParse({
      variant_group_id: formData.get("variant_group_id"),
      parent_product_id: formData.get("parent_product_id"),
      sku: formData.get("sku"),
      price: formData.get("price"),
      quantity: formData.get("quantity"),
      status: formData.get("status"),
      images: imagesJson,
      attribute_selections: attributeSelectionsJson,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data.",
      };
    }

    const {
      variant_group_id,
      parent_product_id,
      sku,
      price,
      quantity,
      status,
      images: imageUrls,
      attribute_selections,
    } = parsed.data;

    const supabase = await createClient();

    const { data: vg, error: vgError } = await supabase
      .from("variant_groups")
      .select("id, product_id")
      .eq("id", variant_group_id)
      .maybeSingle();

    if (vgError) {
      return { success: false, error: vgError.message };
    }
    if (!vg || vg.product_id !== parent_product_id) {
      return {
        success: false,
        error: "Invalid variant group for this product.",
      };
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, type")
      .eq("id", parent_product_id)
      .maybeSingle();

    if (productError) {
      return { success: false, error: productError.message };
    }
    if (!product || product.type !== "CONFIGURABLE") {
      return {
        success: false,
        error: "Variants can only be created for configurable products.",
      };
    }

    const { data: junction, error: junctionError } = await supabase
      .from("variant_group_attributes")
      .select("attribute_id")
      .eq("variant_group_id", variant_group_id)
      .order("sort_order", { ascending: true });

    if (junctionError) {
      return { success: false, error: junctionError.message };
    }

    const expectedIds = (junction ?? []).map((r) => r.attribute_id);
    const byAttr = new Map(
      attribute_selections.map((r) => [r.attribute_id, r.option_id]),
    );

    if (expectedIds.length !== attribute_selections.length) {
      return {
        success: false,
        error: "Select exactly one option for each variant attribute.",
      };
    }
    for (const id of expectedIds) {
      if (!byAttr.has(id)) {
        return {
          success: false,
          error: "Select exactly one option for each variant attribute.",
        };
      }
    }
    for (const sel of attribute_selections) {
      if (!expectedIds.includes(sel.attribute_id)) {
        return {
          success: false,
          error: "Invalid attribute option for this variant group.",
        };
      }
    }

    const newKey = variantAttributeOptionSetKey(attribute_selections);
    const siblingLoad = await loadSiblingOptionSetKeys(
      supabase,
      variant_group_id,
      null,
    );
    if (!siblingLoad.ok) {
      return { success: false, error: siblingLoad.message };
    }
    for (const existing of siblingLoad.keys.values()) {
      if (existing === newKey) {
        return {
          success: false,
          error: "A variant with these attribute values already exists.",
        };
      }
    }

    const { data: inserted, error: insertVariantError } = await supabase
      .from("product_variants")
      .insert({
        variant_group_id,
        parent_product_id,
        sku,
        price,
        quantity,
        status,
      })
      .select("id")
      .single();

    if (insertVariantError) {
      return { success: false, error: insertVariantError.message };
    }

    const variantId = inserted.id;

    const rollbackVariant = async () => {
      await supabase.from("product_variants").delete().eq("id", variantId);
    };

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((image_url: string, index: number) => ({
        variant_id: variantId,
        image_url,
        sort_order: index,
      }));
      const { error: imagesError } = await supabase
        .from("variant_images")
        .insert(imageRows);
      if (imagesError) {
        await rollbackVariant();
        return { success: false, error: imagesError.message };
      }
    }

    const valueRows = attribute_selections.map((row) => ({
      variant_id: variantId,
      attribute_id: row.attribute_id,
      option_id: row.option_id,
      text_value: null,
    }));

    const { error: valuesError } = await supabase
      .from("variant_attribute_values")
      .insert(valueRows);

    if (valuesError) {
      await rollbackVariant();
      return { success: false, error: valuesError.message };
    }

    revalidatePath("/products");
    revalidatePath(`/products/${parent_product_id}/edit`);
    return { success: true, data: { id: variantId } };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateVariant(
  formData: FormData,
): Promise<ActionResult<null>> {
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
      const raw = formData.get("attribute_selections_json");
      attributeSelectionsJson =
        raw == null || raw === "" ? [] : JSON.parse(String(raw));
    } catch {
      return { success: false, error: "Invalid attribute options." };
    }

    const parsed = UpdateVariantFormSchema.safeParse({
      variant_id: formData.get("variant_id"),
      variant_group_id: formData.get("variant_group_id"),
      parent_product_id: formData.get("parent_product_id"),
      sku: formData.get("sku"),
      price: formData.get("price"),
      quantity: formData.get("quantity"),
      status: formData.get("status"),
      images: imagesJson,
      attribute_selections: attributeSelectionsJson,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid data.",
      };
    }

    const {
      variant_id,
      variant_group_id,
      parent_product_id,
      sku,
      price,
      quantity,
      status,
      images: imageUrls,
      attribute_selections,
    } = parsed.data;

    const supabase = await createClient();

    const { data: existingVariant, error: existingError } = await supabase
      .from("product_variants")
      .select("id, variant_group_id, parent_product_id")
      .eq("id", variant_id)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: existingError.message };
    }
    if (!existingVariant) {
      return { success: false, error: "Variant not found." };
    }
    if (
      existingVariant.variant_group_id !== variant_group_id ||
      existingVariant.parent_product_id !== parent_product_id
    ) {
      return { success: false, error: "Invalid variant for this product." };
    }

    const { data: vg, error: vgError } = await supabase
      .from("variant_groups")
      .select("id, product_id")
      .eq("id", variant_group_id)
      .maybeSingle();

    if (vgError) {
      return { success: false, error: vgError.message };
    }
    if (!vg || vg.product_id !== parent_product_id) {
      return {
        success: false,
        error: "Invalid variant group for this product.",
      };
    }

    const { data: junction, error: junctionError } = await supabase
      .from("variant_group_attributes")
      .select("attribute_id")
      .eq("variant_group_id", variant_group_id)
      .order("sort_order", { ascending: true });

    if (junctionError) {
      return { success: false, error: junctionError.message };
    }

    const expectedIds = (junction ?? []).map((r) => r.attribute_id);
    const byAttr = new Map(
      attribute_selections.map((r) => [r.attribute_id, r.option_id]),
    );

    if (expectedIds.length !== attribute_selections.length) {
      return {
        success: false,
        error: "Select exactly one option for each variant attribute.",
      };
    }
    for (const id of expectedIds) {
      if (!byAttr.has(id)) {
        return {
          success: false,
          error: "Select exactly one option for each variant attribute.",
        };
      }
    }
    for (const sel of attribute_selections) {
      if (!expectedIds.includes(sel.attribute_id)) {
        return {
          success: false,
          error: "Invalid attribute option for this variant group.",
        };
      }
    }

    const newKey = variantAttributeOptionSetKey(attribute_selections);
    const siblingLoad = await loadSiblingOptionSetKeys(
      supabase,
      variant_group_id,
      variant_id,
    );
    if (!siblingLoad.ok) {
      return { success: false, error: siblingLoad.message };
    }
    for (const existing of siblingLoad.keys.values()) {
      if (existing === newKey) {
        return {
          success: false,
          error: "A variant with these attribute values already exists.",
        };
      }
    }

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({
        sku,
        price,
        quantity,
        status,
      })
      .eq("id", variant_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: deleteImagesError } = await supabase
      .from("variant_images")
      .delete()
      .eq("variant_id", variant_id);

    if (deleteImagesError) {
      return { success: false, error: deleteImagesError.message };
    }

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((image_url: string, index: number) => ({
        variant_id,
        image_url,
        sort_order: index,
      }));
      const { error: imagesError } = await supabase
        .from("variant_images")
        .insert(imageRows);
      if (imagesError) {
        return { success: false, error: imagesError.message };
      }
    }

    const { error: deleteValuesError } = await supabase
      .from("variant_attribute_values")
      .delete()
      .eq("variant_id", variant_id);

    if (deleteValuesError) {
      return { success: false, error: deleteValuesError.message };
    }

    const valueRows = attribute_selections.map((row) => ({
      variant_id,
      attribute_id: row.attribute_id,
      option_id: row.option_id,
      text_value: null,
    }));

    const { error: valuesError } = await supabase
      .from("variant_attribute_values")
      .insert(valueRows);

    if (valuesError) {
      return { success: false, error: valuesError.message };
    }

    revalidatePath("/products");
    revalidatePath(`/products/${parent_product_id}/edit`);
    return { success: true, data: null };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}
