"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { createProduct, createVariantGroup } from "@/actions/products.actions";
import {
  ProductDetailsFields,
  ProductImagesField,
  StatusInventoryFields,
} from "@/components/products/product-fields";
import { VariantGroupAttributePicker } from "@/components/products/variant-group-attribute-picker";
import { MutateButton } from "@/components/shared/mutate-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { fieldMessage } from "@/lib/utils";
import type {
  AttributeForProductForm,
  CategoryOptionForProductForm,
} from "@/types";
import {
  CreateProductSchema,
  type CreateProductFormValues,
} from "@/validations/product.validations";

type ConfigurableProductFormProps = {
  categories: CategoryOptionForProductForm[];
  attributes: AttributeForProductForm[];
};

export function ConfigurableProductForm({
  categories,
  attributes,
}: ConfigurableProductFormProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const canMutate = can("mutate");
  const [pending, setPending] = useState(false);

  const attributesWithOptions = useMemo(
    () => attributes.filter((a) => a.attribute_options.length > 0),
    [attributes],
  );

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      type: "CONFIGURABLE",
      title: "",
      category_id: "",
      short_description: "",
      description: "",
      sku: "",
      price: 0,
      quantity: 0,
      status: "ENABLED",
      visibility: true,
      images: [],
      variantGroupAttributeIds: [],
    },
  });

  const handleCreate = async () => {
    const ok = await form.trigger();
    if (!ok) return;

    const parsed = CreateProductSchema.safeParse(form.getValues());
    if (!parsed.success) {
      form.setError("root", {
        message: parsed.error.issues[0]?.message ?? "Invalid data.",
      });
      return;
    }
    const values = parsed.data;
    if (values.type !== "CONFIGURABLE") return;

    setPending(true);
    try {
      const fd = new FormData();
      fd.set("type", "CONFIGURABLE");
      fd.set("title", values.title);
      fd.set("category_id", values.category_id);
      fd.set("short_description", values.short_description ?? "");
      fd.set("description", values.description ?? "");
      fd.set("sku", values.sku);
      fd.set("price", String(values.price));
      fd.set("quantity", String(values.quantity));
      fd.set("status", values.status);
      fd.set("visibility", values.visibility ? "true" : "false");
      fd.set("images_json", JSON.stringify(values.images));
      fd.set(
        "variantGroupAttributeIds_json",
        JSON.stringify(values.variantGroupAttributeIds),
      );

      const result = await createProduct(fd);
      if (!result.success) {
        form.setError("root", { message: result.error });
        return;
      }

      const fdGroup = new FormData();
      fdGroup.set("product_id", result.data.id);
      fdGroup.set(
        "attribute_ids_json",
        JSON.stringify(values.variantGroupAttributeIds),
      );
      const groupResult = await createVariantGroup(fdGroup);
      if (!groupResult.success) {
        form.setError("root", { message: groupResult.error });
        return;
      }

      router.push(`/products/${result.data.id}/edit`);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" noValidate>
      <div className="grid gap-6 lg:grid-cols-[1fr_17.5rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <ProductDetailsFields
            register={form.register}
            control={form.control}
            errors={form.formState.errors}
            disabled={!canMutate}
            categories={categories}
          />
          <ProductImagesField
            control={form.control}
            errors={form.formState.errors}
            trigger={form.trigger}
            disabled={!canMutate}
          />
        </div>

        <div>
          <StatusInventoryFields
            register={form.register}
            control={form.control}
            errors={form.formState.errors}
            disabled={!canMutate}
          />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Variant attributes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pick at least two attributes.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Controller
                name="variantGroupAttributeIds"
                control={form.control}
                render={({ field }) => (
                  <VariantGroupAttributePicker
                    attributes={attributesWithOptions}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    disabled={!canMutate}
                  />
                )}
              />
              {"variantGroupAttributeIds" in form.formState.errors &&
              form.formState.errors.variantGroupAttributeIds ? (
                <p className="text-sm text-destructive">
                  {fieldMessage(form.formState.errors.variantGroupAttributeIds)}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {form.formState.errors.root ? (
        <p className="text-sm text-destructive">
          {fieldMessage(form.formState.errors.root)}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/products")}
        >
          Cancel
        </Button>
        <MutateButton
          type="button"
          loading={pending}
          onClick={() => void handleCreate()}
        >
          {pending ? "Creating…" : "Create variant group"}
        </MutateButton>
      </div>
    </form>
  );
}
