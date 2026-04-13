"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { createProduct } from "@/actions/products.actions";
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
} from "@/types";
import {
  CreateProductSchema,
  type CreateProductFormValues,
  type CreateProductValues,
} from "@/validations/product.validations";

type SimpleProductFormProps = {
  categories: CategoryOptionForProductForm[];
  attributes: AttributeForProductForm[];
};

export function SimpleProductForm({
  categories,
  attributes,
}: SimpleProductFormProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const canMutate = can("mutate");

  const attributesWithOptions = useMemo(
    () => attributes.filter((a) => a.attribute_options.length > 0),
    [attributes],
  );

  const form = useForm<CreateProductFormValues, unknown, CreateProductValues>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      type: "SIMPLE",
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
      attributeSelections: attributesWithOptions.map((a) => ({
        attribute_id: a.id,
        option_id: undefined,
      })),
    },
  });

  const onSubmit = async (values: CreateProductValues) => {
    if (values.type !== "SIMPLE") return;

    const fd = new FormData();
    fd.set("type", "SIMPLE");
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

    const result = await createProduct(fd);
    if (!result.success) {
      form.setError("root", { message: result.error });
      return;
    }
    router.push("/products");
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
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
          <SimpleAttributesFields
            register={form.register}
            control={form.control}
            disabled={!canMutate}
            attributesWithOptions={attributesWithOptions}
          />
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
          {form.formState.isSubmitting ? "Creating…" : "Save product"}
        </MutateButton>
      </div>
    </form>
  );
}
