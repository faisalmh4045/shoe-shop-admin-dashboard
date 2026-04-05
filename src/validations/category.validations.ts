import { z } from "zod";

const formBool = (whenMissing: boolean) =>
  z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => {
      if (v === undefined) return whenMissing;
      return v === true || v === "true";
    });

export const CreateCategorySchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
  description: z.string().default(""),
  image: z
    .string()
    .optional()
    .transform((s) => {
      if (s == null) return undefined;
      const t = s.trim();
      return t === "" ? undefined : t;
    })
    .refine(
      (s) => s === undefined || z.string().url().safeParse(s).success,
      "Image must be a valid URL.",
    ),
  status: formBool(true),
  include_in_nav: formBool(false),
  sort_order: z.coerce
    .number()
    .int()
    .min(0, "Sort order must be 0 or greater."),
});

/** Parsed payload (server insert + submit handler) */
export type CreateCategoryValues = z.infer<typeof CreateCategorySchema>;
/** RHF field values before Zod transforms */
export type CreateCategoryFormValues = z.input<typeof CreateCategorySchema>;
