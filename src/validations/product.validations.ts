import { z } from "zod";

const formBool = (whenMissing: boolean) =>
  z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => {
      if (v === undefined) return whenMissing;
      return v === true || v === "true";
    });

const attributeSelectionRow = z.object({
  attribute_id: z.string().uuid(),
  option_id: z
    .string()
    .optional()
    .transform((s) => {
      if (s == null) return undefined;
      const t = s.trim();
      return t === "" ? undefined : t;
    })
    .refine(
      (s) => s === undefined || z.string().uuid().safeParse(s).success,
      "Invalid attribute option.",
    ),
});

/** Scalars + images — shared by create and update product flows. */
export const ProductDetailsSchema = z.object({
  title: z.string().min(1, "Title is required."),
  category_id: z.string().uuid("Select a category."),
  short_description: z.string().default(""),
  description: z.string().default(""),
  sku: z.string().min(1, "SKU is required."),
  price: z.coerce
    .number()
    .min(0, "Price must be 0 or greater.")
    .refine((n) => Number.isFinite(n), "Price must be a valid number."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(0, "Quantity must be 0 or greater."),
  status: z.enum(["ENABLED", "DISABLED"]),
  visibility: formBool(true),
  images: z
    .array(z.string().url("Each image must be a valid URL."))
    .max(8, "You can add at most 8 images.")
    .default([]),
});

export type ProductDetailsValues = z.infer<typeof ProductDetailsSchema>;

export const CreateProductSchema = z
  .discriminatedUnion("type", [
    ProductDetailsSchema.extend({
      type: z.literal("SIMPLE"),
      attributeSelections: z.array(attributeSelectionRow).default([]),
    }),
    ProductDetailsSchema.extend({
      type: z.literal("CONFIGURABLE"),
      variantGroupAttributeIds: z
        .array(z.string().uuid())
        .min(2, "Select at least two attributes for variants.")
        .refine((ids) => new Set(ids).size === ids.length, {
          message: "Each attribute can only be selected once.",
        }),
    }),
  ])
  .transform((data) => {
    if (data.type !== "SIMPLE") return data;
    return {
      ...data,
      attributeSelections: data.attributeSelections.filter(
        (row): row is { attribute_id: string; option_id: string } =>
          row.option_id !== undefined,
      ),
    };
  });

export type CreateProductValues = z.infer<typeof CreateProductSchema>;
export type CreateProductFormValues = z.input<typeof CreateProductSchema>;

export const UpdateProductSchema = ProductDetailsSchema.extend({
  product_id: z.string().uuid(),
  attributeSelections: z.array(attributeSelectionRow).default([]),
}).transform((data) => ({
  ...data,
  attributeSelections: data.attributeSelections.filter(
    (row): row is { attribute_id: string; option_id: string } =>
      row.option_id !== undefined,
  ),
}));

export type UpdateProductValues = z.infer<typeof UpdateProductSchema>;
export type UpdateProductFormValues = z.input<typeof UpdateProductSchema>;

export const CreateVariantGroupSchema = z.object({
  product_id: z.string().uuid(),
  attribute_ids: z
    .array(z.string().uuid())
    .min(2, "Select at least two attributes for variants.")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Each attribute can only be selected once.",
    }),
});

export type CreateVariantGroupValues = z.infer<typeof CreateVariantGroupSchema>;

const variantAttributeOptionRowInput = z.object({
  attribute_id: z.string().uuid(),
  option_id: z
    .string()
    .optional()
    .transform((s) => {
      if (s == null) return undefined;
      const t = s.trim();
      return t === "" ? undefined : t;
    })
    .refine(
      (s) => s === undefined || z.string().uuid().safeParse(s).success,
      "Invalid attribute option.",
    ),
});

export const variantFormBase = z.object({
  variant_group_id: z.string().uuid(),
  parent_product_id: z.string().uuid(),
  sku: z.string().min(1, "SKU is required."),
  price: z.preprocess(
    (raw) => {
      if (raw === "" || raw === null || raw === undefined) return null;
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? n : null;
    },
    z.union([z.number().min(0, "Price must be 0 or greater."), z.null()]),
  ),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(0, "Quantity must be 0 or greater."),
  status: z.enum(["ENABLED", "DISABLED"]),
  images: z
    .array(z.string().url("Each image must be a valid URL."))
    .max(8, "You can add at most 8 images.")
    .default([]),
  attribute_selections: z.array(variantAttributeOptionRowInput).default([]),
});

function filterVariantAttributeSelections<
  T extends {
    attribute_selections: { attribute_id: string; option_id?: string }[];
  },
>(data: T) {
  return {
    ...data,
    attribute_selections: data.attribute_selections.filter(
      (row): row is { attribute_id: string; option_id: string } =>
        row.option_id !== undefined,
    ),
  };
}

/** Variant create — selections validated against group in actions. */
export const VariantFormSchema = variantFormBase
  .transform(filterVariantAttributeSelections)
  .refine((data) => data.attribute_selections.length > 0, {
    message: "Select an option for each attribute.",
    path: ["attribute_selections"],
  });

export type VariantFormValues = z.infer<typeof VariantFormSchema>;

export const UpdateVariantFormSchema = variantFormBase
  .extend({
    variant_id: z.string().uuid(),
  })
  .transform((data) => {
    const { variant_id, ...rest } = data;
    return { variant_id, ...filterVariantAttributeSelections(rest) };
  })
  .refine((data) => data.attribute_selections.length > 0, {
    message: "Select an option for each attribute.",
    path: ["attribute_selections"],
  });

export type UpdateVariantFormValues = z.infer<typeof UpdateVariantFormSchema>;

/** Stable key for duplicate option-set detection (sorted attribute_id). */
export function variantAttributeOptionSetKey(
  rows: { attribute_id: string; option_id: string }[],
): string {
  return [...rows]
    .sort((a, b) => a.attribute_id.localeCompare(b.attribute_id))
    .map((r) => `${r.attribute_id}:${r.option_id}`)
    .join("|");
}
