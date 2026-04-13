"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
  type UseFormTrigger,
} from "react-hook-form";

import { MultiImageDropzone } from "@/components/shared/multi-image-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type {
  AttributeForProductForm,
  CategoryOptionForProductForm,
} from "@/types";
import { fieldMessage } from "@/lib/utils";

const NONE = "__none__";

type ProductDetailsFieldsProps<T extends FieldValues> = {
  register: UseFormRegister<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  disabled: boolean;
  categories: CategoryOptionForProductForm[];
};

export function ProductDetailsFields<T extends FieldValues>({
  register,
  control,
  errors,
  disabled,
  categories,
}: ProductDetailsFieldsProps<T>) {
  return (
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
            disabled={disabled}
            aria-invalid={Boolean(errors.title)}
            {...register("title" as Path<T>)}
          />
          {errors.title ? (
            <p className="text-sm text-destructive">
              {fieldMessage(errors.title)}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product-sku">SKU</Label>
            <Input
              id="product-sku"
              autoComplete="off"
              disabled={disabled}
              aria-invalid={Boolean(errors.sku)}
              {...register("sku" as Path<T>)}
            />
            {errors.sku ? (
              <p className="text-sm text-destructive">
                {fieldMessage(errors.sku)}
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
              disabled={disabled}
              aria-invalid={Boolean(errors.price)}
              {...register("price" as Path<T>, { valueAsNumber: true })}
            />
            {errors.price ? (
              <p className="text-sm text-destructive">
                {fieldMessage(errors.price)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Controller
            name={"category_id" as Path<T>}
            control={control}
            render={({ field }) => (
              <Select
                value={field.value === "" ? NONE : field.value}
                onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                disabled={disabled || categories.length === 0}
              >
                <SelectTrigger
                  className="w-full max-w-md"
                  aria-invalid={Boolean(errors.category_id)}
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
          {errors.category_id ? (
            <p className="text-sm text-destructive">
              {fieldMessage(errors.category_id)}
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
            disabled={disabled}
            aria-invalid={Boolean(errors.short_description)}
            {...register("short_description" as Path<T>)}
          />
          {errors.short_description ? (
            <p className="text-sm text-destructive">
              {fieldMessage(errors.short_description)}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-desc">Description</Label>
          <textarea
            id="product-desc"
            rows={5}
            disabled={disabled}
            className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
            aria-invalid={Boolean(errors.description)}
            {...register("description" as Path<T>)}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">
              {fieldMessage(errors.description)}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

type ProductImagesFieldProps<T extends FieldValues> = {
  control: Control<T>;
  errors: FieldErrors<T>;
  trigger: UseFormTrigger<T>;
  disabled: boolean;
};

export function ProductImagesField<T extends FieldValues>({
  control,
  errors,
  trigger,
  disabled,
}: ProductImagesFieldProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product images</CardTitle>
      </CardHeader>
      <CardContent>
        <Controller
          name={"images" as Path<T>}
          control={control}
          render={({ field }) => (
            <MultiImageDropzone
              value={field.value ?? []}
              onChange={(urls) => {
                field.onChange(urls);
                void trigger("images" as Path<T>);
              }}
              disabled={disabled}
              errorId="product-images-error"
              errorMessage={
                errors.images ? fieldMessage(errors.images) : undefined
              }
            />
          )}
        />
      </CardContent>
    </Card>
  );
}

type StatusInventoryFieldsProps<T extends FieldValues> = {
  register: UseFormRegister<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  disabled: boolean;
};

export function StatusInventoryFields<T extends FieldValues>({
  register,
  control,
  errors,
  disabled,
}: StatusInventoryFieldsProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status &amp; inventory</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            name={"status" as Path<T>}
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value="ENABLED"
                    checked={field.value === "ENABLED"}
                    onChange={() => field.onChange("ENABLED")}
                    disabled={disabled}
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
                    disabled={disabled}
                    className="size-4 accent-primary"
                  />
                  Disabled
                </label>
              </div>
            )}
          />
          {errors.status ? (
            <p className="text-sm text-destructive">
              {fieldMessage(errors.status)}
            </p>
          ) : null}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Visibility</Label>
          <Controller
            name={"visibility" as Path<T>}
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="visibility"
                    value="false"
                    checked={field.value === false || field.value === "false"}
                    onChange={() => field.onChange(false)}
                    disabled={disabled}
                    className="size-4 accent-primary"
                  />
                  Not visible individually
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="visibility"
                    value="true"
                    checked={field.value === true || field.value === "true"}
                    onChange={() => field.onChange(true)}
                    disabled={disabled}
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
            disabled={disabled}
            aria-invalid={Boolean(errors.quantity)}
            {...register("quantity" as Path<T>, { valueAsNumber: true })}
          />
          {errors.quantity ? (
            <p className="text-sm text-destructive">
              {fieldMessage(errors.quantity)}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

type SimpleAttributesFieldsProps<T extends FieldValues> = {
  register: UseFormRegister<T>;
  control: Control<T>;
  disabled: boolean;
  attributesWithOptions: AttributeForProductForm[];
};

export function SimpleAttributesFields<T extends FieldValues>({
  register,
  control,
  disabled,
  attributesWithOptions,
}: SimpleAttributesFieldsProps<T>) {
  if (attributesWithOptions.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Attributes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {attributesWithOptions.map((attr, index) => (
          <div key={attr.id} className="space-y-2">
            <input
              type="hidden"
              {...register(
                `attributeSelections.${index}.attribute_id` as Path<T>,
              )}
            />
            <Label>{attr.attribute_name}</Label>
            <Controller
              name={`attributeSelections.${index}.option_id` as Path<T>}
              control={control}
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
                  disabled={disabled}
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
  );
}
