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

export const CreateSimpleProductSchema = z
  .object({
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
    attributeSelections: z.array(attributeSelectionRow).default([]),
  })
  .transform((data) => ({
    ...data,
    attributeSelections: data.attributeSelections.filter(
      (row): row is { attribute_id: string; option_id: string } =>
        row.option_id !== undefined,
    ),
  }));

export type CreateSimpleProductValues = z.infer<
  typeof CreateSimpleProductSchema
>;
export type CreateSimpleProductFormValues = z.input<
  typeof CreateSimpleProductSchema
>;
