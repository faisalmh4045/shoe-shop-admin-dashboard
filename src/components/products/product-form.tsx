"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { createProduct } from "@/actions/products.actions";
import { MultiImageDropzone } from "@/components/shared/multi-image-dropzone";
import { MutateButton } from "@/components/shared/mutate-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePermissions } from "@/hooks/usePermissions";
import type {
  AttributeForProductForm,
  CategoryOptionForProductForm,
} from "@/types";
import {
  CreateSimpleProductSchema,
  type CreateSimpleProductFormValues,
  type CreateSimpleProductValues,
} from "@/validations/product.validations";

const NONE = "__none__";

export type ProductFormProps = {
  categories: CategoryOptionForProductForm[];
  attributes: AttributeForProductForm[];
};

export function ProductForm({ categories, attributes }: ProductFormProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const canMutate = can("mutate");

  const attributesWithOptions = useMemo(
    () => attributes.filter((a) => a.attribute_options.length > 0),
    [attributes],
  );

  const defaultValues = useMemo<CreateSimpleProductFormValues>(
    () => ({
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
    }),
    [attributesWithOptions],
  );

  const form = useForm<
    CreateSimpleProductFormValues,
    unknown,
    CreateSimpleProductValues
  >({
    resolver: zodResolver(CreateSimpleProductSchema),
    defaultValues,
  });

  const onSubmit = async (values: CreateSimpleProductValues) => {
    const fd = new FormData();
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
      JSON.stringify(
        values.attributeSelections.map((r) => ({
          attribute_id: r.attribute_id,
          option_id: r.option_id,
        })),
      ),
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
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_17.5rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Product type</p>
            <div className="mt-3 flex flex-wrap gap-6">
              <label className="flex cursor-default items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="product-type"
                  className="size-4 accent-primary"
                  checked
                  readOnly
                  aria-checked="true"
                />
                Simple product
              </label>
              <label
                className="flex cursor-not-allowed items-center gap-2 text-sm opacity-60"
                title="Coming in a later phase"
              >
                <input
                  type="radio"
                  name="product-type"
                  className="size-4"
                  disabled
                  aria-disabled="true"
                />
                Configurable (soon)
              </label>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-title">Product name</Label>
                <Input
                  id="product-title"
                  autoComplete="off"
                  disabled={!canMutate}
                  aria-invalid={Boolean(form.formState.errors.title)}
                  {...form.register("title")}
                />
                {form.formState.errors.title ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    autoComplete="off"
                    disabled={!canMutate}
                    aria-invalid={Boolean(form.formState.errors.sku)}
                    {...form.register("sku")}
                  />
                  {form.formState.errors.sku ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.sku.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-price">Price</Label>
                  <Input
                    id="product-price"
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!canMutate}
                    aria-invalid={Boolean(form.formState.errors.price)}
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.price ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.price.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Controller
                  name="category_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value === "" ? NONE : field.value}
                      onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                      disabled={!canMutate || categories.length === 0}
                    >
                      <SelectTrigger
                        className="w-full max-w-md"
                        aria-invalid={Boolean(
                          form.formState.errors.category_id,
                        )}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Select category</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.category_id ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.category_id.message}
                  </p>
                ) : null}
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Create a category first to assign this product.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-short-desc">Short description</Label>
                <Input
                  id="product-short-desc"
                  autoComplete="off"
                  disabled={!canMutate}
                  aria-invalid={Boolean(
                    form.formState.errors.short_description,
                  )}
                  {...form.register("short_description")}
                />
                {form.formState.errors.short_description ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.short_description.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-desc">Description</Label>
                <textarea
                  id="product-desc"
                  rows={5}
                  disabled={!canMutate}
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register("description")}
                />
                {form.formState.errors.description ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product images</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="images"
                control={form.control}
                render={({ field }) => (
                  <MultiImageDropzone
                    value={field.value ?? []}
                    onChange={(urls) => {
                      field.onChange(urls);
                      void form.trigger("images");
                    }}
                    disabled={!canMutate}
                    errorId="product-images-error"
                    errorMessage={form.formState.errors.images?.message}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status &amp; inventory</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                          name="status"
                          value="ENABLED"
                          checked={field.value === "ENABLED"}
                          onChange={() => field.onChange("ENABLED")}
                          disabled={!canMutate}
                          className="size-4 accent-primary"
                        />
                        Enabled
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="status"
                          value="DISABLED"
                          checked={field.value === "DISABLED"}
                          onChange={() => field.onChange("DISABLED")}
                          disabled={!canMutate}
                          className="size-4 accent-primary"
                        />
                        Disabled
                      </label>
                    </div>
                  )}
                />
                {form.formState.errors.status ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.status.message}
                  </p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Controller
                  name="visibility"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="visibility"
                          value="false"
                          checked={
                            field.value === false || field.value === "false"
                          }
                          onChange={() => field.onChange(false)}
                          disabled={!canMutate}
                          className="size-4 accent-primary"
                        />
                        Not visible individually
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="visibility"
                          value="true"
                          checked={
                            field.value === true || field.value === "true"
                          }
                          onChange={() => field.onChange(true)}
                          disabled={!canMutate}
                          className="size-4 accent-primary"
                        />
                        Catalog, search
                      </label>
                    </div>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="product-quantity">Quantity</Label>
                <Input
                  id="product-quantity"
                  type="number"
                  min={0}
                  step={1}
                  disabled={!canMutate}
                  aria-invalid={Boolean(form.formState.errors.quantity)}
                  {...form.register("quantity", { valueAsNumber: true })}
                />
                {form.formState.errors.quantity ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.quantity.message}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {attributesWithOptions.length > 0 ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {attributesWithOptions.map((attr, index) => (
                  <div key={attr.id} className="space-y-2">
                    <input
                      type="hidden"
                      {...form.register(
                        `attributeSelections.${index}.attribute_id`,
                      )}
                    />
                    <Label>{attr.attribute_name}</Label>
                    <Controller
                      name={`attributeSelections.${index}.option_id`}
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
                          disabled={!canMutate}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>None</SelectItem>
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
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {form.formState.errors.root ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.root.message}
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
