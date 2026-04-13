"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createVariant, updateVariant } from "@/actions/products.actions";
import { MultiImageDropzone } from "@/components/shared/multi-image-dropzone";
import { MutateButton } from "@/components/shared/mutate-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import type {
  AttributeForProductForm,
  ProductVariantForProductDetail,
  VariantGroupAttributeForProductDetail,
} from "@/types";
import {
  UpdateVariantFormSchema,
  VariantFormSchema,
  variantFormBase,
  type UpdateVariantFormValues,
  type VariantFormValues,
} from "@/validations/product.validations";
import type { z } from "zod";
import { Separator } from "../ui/separator";

const NONE = "__none__";

export type VariantModalFormInput = Omit<
  z.input<typeof variantFormBase>,
  "price"
> & {
  /** Empty string means no variant-specific price (stored as null). */
  price?: string | number | null;
  variant_id?: string;
};

export type VariantModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  productId: string;
  variantGroupId: string;
  groupAttributes: VariantGroupAttributeForProductDetail[];
  catalogAttributes: AttributeForProductForm[];
  editingVariant: ProductVariantForProductDetail | null;
};

function attributeWithOptions(
  catalog: AttributeForProductForm[],
  attributeId: string,
): AttributeForProductForm | undefined {
  return catalog.find((a) => a.id === attributeId);
}

function buildDefaults(
  mode: VariantModalProps["mode"],
  productId: string,
  variantGroupId: string,
  groupAttributes: VariantGroupAttributeForProductDetail[],
  editingVariant: ProductVariantForProductDetail | null,
): VariantModalFormInput {
  const images = editingVariant
    ? [...editingVariant.variant_images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => i.image_url)
    : [];

  const attribute_selections = groupAttributes.map((ga) => {
    const row = editingVariant?.variant_attribute_values.find(
      (v) => v.attribute_id === ga.attribute_id,
    );
    return {
      attribute_id: ga.attribute_id,
      option_id: row?.option_id ?? undefined,
    };
  });

  const base: VariantModalFormInput = {
    variant_group_id: variantGroupId,
    parent_product_id: productId,
    sku: editingVariant?.sku ?? "",
    price: editingVariant?.price != null ? Number(editingVariant.price) : "",
    quantity: editingVariant?.quantity ?? 0,
    status: editingVariant?.status ?? "ENABLED",
    images,
    attribute_selections,
  };

  if (mode === "edit" && editingVariant) {
    base.variant_id = editingVariant.id;
  }

  return base;
}

export function VariantModal({
  open,
  onOpenChange,
  mode,
  productId,
  variantGroupId,
  groupAttributes,
  catalogAttributes,
  editingVariant,
}: VariantModalProps) {
  const router = useRouter();

  const defaults = useMemo(
    () =>
      buildDefaults(
        mode,
        productId,
        variantGroupId,
        groupAttributes,
        editingVariant,
      ),
    [mode, productId, variantGroupId, groupAttributes, editingVariant],
  );

  const form = useForm<VariantModalFormInput>({
    resolver: zodResolver(
      mode === "edit" ? UpdateVariantFormSchema : VariantFormSchema,
    ) as Resolver<VariantModalFormInput>,
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      buildDefaults(
        mode,
        productId,
        variantGroupId,
        groupAttributes,
        editingVariant,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when modal opens or target variant changes
  }, [
    open,
    mode,
    productId,
    variantGroupId,
    editingVariant?.id,
    groupAttributes,
  ]);

  const onSubmit = async (
    values: VariantFormValues | UpdateVariantFormValues,
  ) => {
    const fd = new FormData();
    if (mode === "edit" && "variant_id" in values) {
      fd.set("variant_id", values.variant_id);
    }
    fd.set("variant_group_id", values.variant_group_id);
    fd.set("parent_product_id", values.parent_product_id);
    fd.set("sku", values.sku);
    fd.set(
      "price",
      values.price === null || values.price === undefined
        ? ""
        : String(values.price),
    );
    fd.set("quantity", String(values.quantity));
    fd.set("status", values.status);
    fd.set("images_json", JSON.stringify(values.images ?? []));
    fd.set(
      "attribute_selections_json",
      JSON.stringify(values.attribute_selections ?? []),
    );

    const result =
      mode === "edit" ? await updateVariant(fd) : await createVariant(fd);

    if (!result.success) {
      form.setError("root", { message: result.error });
      return;
    }
    onOpenChange(false);
    router.refresh();
  };

  const title = mode === "edit" ? "Edit variant" : "Add variant";

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="flex max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="shrink-0 border-b px-4 pr-14 pb-3">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Set SKU, price, images, and one option for each variant attribute.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(
            (vals) =>
              void onSubmit(
                vals as VariantFormValues | UpdateVariantFormValues,
              ),
          )}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <input type="hidden" {...form.register("variant_group_id")} />
            <input type="hidden" {...form.register("parent_product_id")} />
            {mode === "edit" ? (
              <input type="hidden" {...form.register("variant_id")} />
            ) : null}

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="variant-status"
                        value="ENABLED"
                        checked={field.value === "ENABLED"}
                        onChange={() => field.onChange("ENABLED")}
                        className="size-4 accent-primary"
                      />
                      Enabled
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="variant-status"
                        value="DISABLED"
                        checked={field.value === "DISABLED"}
                        onChange={() => field.onChange("DISABLED")}
                        className="size-4 accent-primary"
                      />
                      Disabled
                    </label>
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant-sku">SKU</Label>
              <Input
                id="variant-sku"
                autoComplete="off"
                aria-invalid={Boolean(form.formState.errors.sku)}
                {...form.register("sku")}
              />
              {form.formState.errors.sku ? (
                <p className="text-sm text-destructive">
                  {String(form.formState.errors.sku.message ?? "")}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-price">Price</Label>
                <Input
                  id="variant-price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Optional"
                  aria-invalid={Boolean(form.formState.errors.price)}
                  {...form.register("price")}
                />
                {form.formState.errors.price ? (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.price.message ?? "")}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-qty">Quantity</Label>
                <Input
                  id="variant-qty"
                  type="number"
                  min={0}
                  step={1}
                  aria-invalid={Boolean(form.formState.errors.quantity)}
                  {...form.register("quantity", { valueAsNumber: true })}
                />
                {form.formState.errors.quantity ? (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors.quantity.message ?? "")}
                  </p>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium">Attribute options</p>
              {groupAttributes.map((ga, index) => {
                const attr = attributeWithOptions(
                  catalogAttributes,
                  ga.attribute_id,
                );
                if (!attr || attr.attribute_options.length === 0) {
                  return (
                    <p key={ga.id} className="text-sm text-destructive">
                      Attribute &quot;{ga.attribute_name}&quot; has no options
                      in the catalog.
                    </p>
                  );
                }
                return (
                  <div key={ga.id} className="space-y-1">
                    <input
                      type="hidden"
                      {...form.register(
                        `attribute_selections.${index}.attribute_id`,
                      )}
                    />
                    <Label>{ga.attribute_name}</Label>
                    <Controller
                      name={`attribute_selections.${index}.option_id`}
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={
                            field.value === undefined || field.value === ""
                              ? NONE
                              : field.value
                          }
                          onValueChange={(v) =>
                            field.onChange(v === NONE ? undefined : v)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Select option</SelectItem>
                            {attr.attribute_options.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.option_text}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                );
              })}
              {form.formState.errors.attribute_selections ? (
                <p className="text-sm text-destructive">
                  {String(
                    form.formState.errors.attribute_selections.message ?? "",
                  )}
                </p>
              ) : null}
            </div>
            <Separator />

            <div className="space-y-2">
              <Label>Variant images</Label>
              <Controller
                name="images"
                control={form.control}
                render={({ field }) => (
                  <MultiImageDropzone
                    value={field.value ?? []}
                    onChange={(urls) => {
                      field.onChange(urls);
                    }}
                    errorMessage={
                      form.formState.errors.images?.message as
                        | string
                        | undefined
                    }
                  />
                )}
              />
            </div>

            {form.formState.errors.root ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}
          </div>

          <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t bg-popover px-4 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <MutateButton type="submit" loading={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving…"
                : mode === "edit"
                  ? "Save variant"
                  : "Create variant"}
            </MutateButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
