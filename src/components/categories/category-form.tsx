"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { createCategory, updateCategory } from "@/actions/categories.actions";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { MutateButton } from "@/components/shared/mutate-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";
import {
  CreateCategorySchema,
  type CreateCategoryFormValues,
  type CreateCategoryValues,
} from "@/validations/category.validations";

const CREATE_DEFAULTS: CreateCategoryFormValues = {
  title: "",
  slug: "",
  description: "",
  image: "",
  status: true,
  include_in_nav: false,
  sort_order: 0,
};

type CategoryFormProps = {
  categoryId?: string;
  defaultValues?: CreateCategoryFormValues;
};

export function CategoryForm({
  categoryId,
  defaultValues: serverDefaultValues,
}: CategoryFormProps = {}) {
  const router = useRouter();
  const { can } = usePermissions();
  const canMutate = can("mutate");
  const isEdit = Boolean(categoryId);

  const form = useForm<CreateCategoryFormValues, unknown, CreateCategoryValues>(
    {
      resolver: zodResolver(CreateCategorySchema),
      defaultValues: serverDefaultValues ?? CREATE_DEFAULTS,
    },
  );

  const onSubmit = async (values: CreateCategoryValues) => {
    const fd = new FormData();
    fd.set("title", values.title);
    fd.set("slug", values.slug);
    fd.set("description", values.description ?? "");
    fd.set("image", values.image?.trim() ? values.image.trim() : "");
    fd.set("status", values.status ? "true" : "false");
    fd.set("include_in_nav", values.include_in_nav ? "true" : "false");
    fd.set("sort_order", String(values.sort_order));

    if (categoryId) {
      const result = await updateCategory(categoryId, fd);
      if (!result.success) {
        form.setError("root", { message: result.error });
        return;
      }
    } else {
      const result = await createCategory(fd);
      if (!result.success) {
        form.setError("root", { message: result.error });
        return;
      }
    }
    router.push("/categories");
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Category details</CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="category-title">Title</Label>
            <Input
              id="category-title"
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

          <div className="space-y-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              autoComplete="off"
              placeholder="e.g. running-shoes"
              disabled={!canMutate}
              aria-invalid={Boolean(form.formState.errors.slug)}
              {...form.register("slug")}
            />
            {form.formState.errors.slug ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.slug.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <textarea
              id="category-description"
              rows={4}
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

          <Controller
            name="image"
            control={form.control}
            render={({ field }) => (
              <ImageDropzone
                imageUrl={typeof field.value === "string" ? field.value : ""}
                onUploaded={(url) => {
                  field.onChange(url);
                  void form.trigger("image");
                }}
                onClear={() => {
                  field.onChange("");
                  void form.trigger("image");
                }}
                disabled={!canMutate}
                errorId="category-image-error"
                errorMessage={form.formState.errors.image?.message}
              />
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="category-sort">Sort order</Label>
            <Input
              id="category-sort"
              type="number"
              min={0}
              step={1}
              disabled={!canMutate}
              aria-invalid={Boolean(form.formState.errors.sort_order)}
              {...form.register("sort_order", { valueAsNumber: true })}
            />
            {form.formState.errors.sort_order ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.sort_order.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={field.value !== false && field.value !== "false"}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    disabled={!canMutate}
                  />
                  <span className="text-sm font-medium">Visible (active)</span>
                </label>
              )}
            />
            <Controller
              name="include_in_nav"
              control={form.control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={field.value === true || field.value === "true"}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    disabled={!canMutate}
                  />
                  <span className="text-sm font-medium">
                    Include in navigation
                  </span>
                </label>
              )}
            />
          </div>

          {form.formState.errors.root ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="mt-4 justify-end gap-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/categories")}
          >
            Cancel
          </Button>
          <MutateButton type="submit" loading={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create category"}
          </MutateButton>
        </CardFooter>
      </form>
    </Card>
  );
}
