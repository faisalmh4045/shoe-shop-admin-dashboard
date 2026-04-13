"use client";

import { useState } from "react";

import { ConfigurableProductForm } from "@/components/products/configurable-product-form";
import { SimpleProductForm } from "@/components/products/simple-product-form";
import type {
  AttributeForProductForm,
  CategoryOptionForProductForm,
} from "@/types";

type NewProductWorkflowProps = {
  categories: CategoryOptionForProductForm[];
  attributes: AttributeForProductForm[];
};

export function ProductFormByType({
  categories,
  attributes,
}: NewProductWorkflowProps) {
  const [type, setType] = useState<"SIMPLE" | "CONFIGURABLE">("SIMPLE");

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">Creation workflow</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="new-product-workflow"
              className="size-4 accent-primary"
              checked={type === "SIMPLE"}
              onChange={() => setType("SIMPLE")}
            />
            Simple product
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="new-product-workflow"
              className="size-4 accent-primary"
              checked={type === "CONFIGURABLE"}
              onChange={() => setType("CONFIGURABLE")}
            />
            Configurable product
          </label>
        </div>
      </div>

      {type === "SIMPLE" ? (
        <SimpleProductForm categories={categories} attributes={attributes} />
      ) : (
        <ConfigurableProductForm
          categories={categories}
          attributes={attributes}
        />
      )}
    </div>
  );
}
