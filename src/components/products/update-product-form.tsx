"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { updateProduct } from "@/actions/products.actions";
import {
  ProductDetailsFields,
  ProductImagesField,
  SimpleAttributesFields,
  StatusInventoryFields,
} from "@/components/products/product-fields";
import { MutateButton } from "@/components/shared/mutate-button";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { fieldMessage } from "@/lib/utils";
import type {
  AttributeForProductForm,
  CategoryOptionForProductForm,
  ProductType,
} from "@/types";
import {
  UpdateProductSchema,
  type UpdateProductFormValues,
  type UpdateProductValues,
} from "@/validations/product.validations";

type UpdateProductFormProps = {
  categories: CategoryOptionForProductForm[];
  attributes: AttributeForProductForm[];
  productId: string;
  initialProductType: ProductType;
  initialValues: Partial<UpdateProductFormValues>;
  configurableDetailsOnly?: boolean;
};

export function UpdateProductForm({
  categories,
  attributes,
  productId,
  initialProductType,
  initialValues,
  configurableDetailsOnly = false,
}: UpdateProductFormProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const canMutate = can("mutate");

  const attributesWithOptions = useMemo(
    () => attributes.filter((a) => a.attribute_options.length > 0),
    [attributes],
  );

  const form = useForm<UpdateProductFormValues, unknown, UpdateProductValues>({
    resolver: zodResolver(UpdateProductSchema),
    defaultValues: {
      product_id: productId,
      title: initialValues.title ?? "",
      category_id: initialValues.category_id ?? "",
      short_description: initialValues.short_description ?? "",
      description: initialValues.description ?? "",
      sku: initialValues.sku ?? "",
      price: initialValues.price ?? 0,
      quantity: initialValues.quantity ?? 0,
      status: initialValues.status ?? "ENABLED",
      visibility: initialValues.visibility ?? true,
      images: initialValues.images ?? [],
      attributeSelections: initialValues.attributeSelections ?? [],
    },
  });

  const onSubmit = async (values: UpdateProductValues) => {
    const fd = new FormData();
    fd.set("product_id", values.product_id);
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
      "attributeSelections_json",
      JSON.stringify(values.attributeSelections),
    );

    const result = await updateProduct(fd);
    if (!result.success) {
      form.setError("root", { message: result.error });
      return;
    }
    router.refresh();
  };

  const showSimpleAttributes =
    !configurableDetailsOnly && initialProductType === "SIMPLE";

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <input type="hidden" {...form.register("product_id")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_17.5rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Product type</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {initialProductType === "CONFIGURABLE"
                ? "Configurable"
                : "Simple"}{" "}
              <span className="text-xs">(type cannot be changed)</span>
            </p>
          </div>

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
          {showSimpleAttributes ? (
            <SimpleAttributesFields
              register={form.register}
              control={form.control}
              disabled={!canMutate}
              attributesWithOptions={attributesWithOptions}
            />
          ) : null}
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
        <MutateButton type="submit" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save changes"}
        </MutateButton>
      </div>
    </form>
  );
}
