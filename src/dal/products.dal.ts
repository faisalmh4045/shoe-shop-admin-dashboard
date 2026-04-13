import "server-only";

import { cache } from "react";

import { requireAdmin } from "@/dal/auth.dal";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Product,
  ProductDetail,
  ProductImage,
  ProductListRow,
  ProductVariant,
  ProductVariantForProductDetail,
  VariantAttributeValueForProductDetail,
  VariantGroupAttributeForProductDetail,
  VariantGroupForProductDetail,
  VariantImage,
} from "@/types";

function normalizeCategoryTitle(
  embedded: Pick<Category, "title"> | Pick<Category, "title">[] | null,
): Pick<Category, "title"> | null {
  if (embedded == null) return null;
  if (Array.isArray(embedded)) return embedded[0] ?? null;
  return embedded;
}

function embedOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type RawVariantGroupAttribute = {
  id: string;
  sort_order: number;
  attribute_id: string;
  attributes:
    | { id: string; attribute_name: string }
    | { id: string; attribute_name: string }[]
    | null;
};

type RawVariantAttributeValue = {
  id: string;
  attribute_id: string;
  option_id: string | null;
  text_value: string | null;
  attributes: { attribute_name: string } | { attribute_name: string }[] | null;
  attribute_options: { option_text: string } | { option_text: string }[] | null;
};

type RawVariant = ProductVariant & {
  variant_images: VariantImage[] | null;
  variant_attribute_values: RawVariantAttributeValue[] | null;
};

type RawVariantGroup = {
  id: string;
  created_at: string;
  updated_at: string;
  variant_group_attributes: RawVariantGroupAttribute[] | null;
  product_variants: RawVariant[] | null;
};

type RawProductDetail = Product & {
  product_images: ProductImage[] | null;
  product_attribute_values:
    | {
        attribute_id: string;
        option_id: string | null;
      }[]
    | null;
  /** PostgREST may return one row as an object or as a single-element array. */
  variant_groups: RawVariantGroup[] | RawVariantGroup | null;
};

function normalizeVariantAttributeValue(
  row: RawVariantAttributeValue,
): VariantAttributeValueForProductDetail {
  const attr = embedOne(row.attributes);
  const opt = embedOne(row.attribute_options);
  return {
    id: row.id,
    attribute_id: row.attribute_id,
    attribute_name: attr?.attribute_name ?? "—",
    option_id: row.option_id,
    option_text: opt?.option_text ?? null,
    text_value: row.text_value,
  };
}

function normalizeVariant(row: RawVariant): ProductVariantForProductDetail {
  const values = (row.variant_attribute_values ?? []).map(
    normalizeVariantAttributeValue,
  );
  return {
    id: row.id,
    variant_group_id: row.variant_group_id,
    parent_product_id: row.parent_product_id,
    sku: row.sku,
    status: row.status,
    quantity: row.quantity,
    price: row.price,
    created_at: row.created_at,
    updated_at: row.updated_at,
    variant_images: row.variant_images ?? [],
    variant_attribute_values: values,
  };
}

function normalizeVariantGroup(
  raw: RawVariantGroup,
): VariantGroupForProductDetail {
  const attrs: VariantGroupAttributeForProductDetail[] = (
    raw.variant_group_attributes ?? []
  ).map((row) => {
    const attr = embedOne(row.attributes);
    return {
      id: row.id,
      attribute_id: row.attribute_id,
      attribute_name: attr?.attribute_name ?? "—",
      sort_order: row.sort_order,
    };
  });

  const variants = [...(raw.product_variants ?? [])]
    .map(normalizeVariant)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  return {
    id: raw.id,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    attributes: attrs,
    variants,
  };
}

export const getProductById = cache(
  async (id: string): Promise<ProductDetail | null> => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_images (*),
        product_attribute_values ( attribute_id, option_id ),
        variant_groups (
          id,
          created_at,
          updated_at,
          variant_group_attributes (
            id,
            sort_order,
            attribute_id,
            attributes ( id, attribute_name )
          ),
          product_variants (
            *,
            variant_images (*),
            variant_attribute_values (
              id,
              attribute_id,
              option_id,
              text_value,
              attributes ( attribute_name ),
              attribute_options ( option_text )
            )
          )
        )
      `,
      )
      .order("sort_order", {
        ascending: true,
        referencedTable: "product_images",
      })
      .order("sort_order", {
        ascending: true,
        referencedTable: "variant_groups.product_variants.variant_images",
      })
      .order("sort_order", {
        ascending: true,
        referencedTable: "variant_groups.variant_group_attributes",
      })
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row = data as unknown as RawProductDetail;
    const images = row.product_images ?? [];
    const pav = row.product_attribute_values ?? [];
    const vgRaw = embedOne(row.variant_groups);

    const variant_group = vgRaw ? normalizeVariantGroup(vgRaw) : null;

    return {
      id: row.id,
      category_id: row.category_id,
      type: row.type,
      title: row.title,
      slug: row.slug,
      sku: row.sku,
      price: row.price,
      short_description: row.short_description,
      description: row.description,
      status: row.status,
      visibility: row.visibility,
      quantity: row.quantity,
      created_at: row.created_at,
      updated_at: row.updated_at,
      fts: row.fts,
      product_images: images,
      product_attribute_values: pav,
      variant_group,
    };
  },
);

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
