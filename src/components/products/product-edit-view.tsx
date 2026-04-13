"use client";

import { useMemo, useState } from "react";

import { UpdateProductForm } from "@/components/products/update-product-form";
import { VariantModal } from "@/components/products/variant-modal";
import { VariantsTable } from "@/components/products/variants-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AttributeForProductForm,
  CategoryOptionForProductForm,
  ProductDetail,
  ProductVariantForProductDetail,
} from "@/types";

export type ProductEditViewProps = {
  product: ProductDetail;
  categories: CategoryOptionForProductForm[];
  attributes: AttributeForProductForm[];
};

function mapProductToFormInitials(product: ProductDetail) {
  const images = product.product_images.map((row) => row.image_url);

  return {
    title: product.title,
    category_id: product.category_id,
    short_description: product.short_description ?? "",
    description: product.description ?? "",
    sku: product.sku,
    price: product.price,
    quantity: product.quantity,
    status: product.status,
    visibility: product.visibility,
    images,
  };
}

function buildAttributeSelectionsForEdit(
  attrsWithOptions: AttributeForProductForm[],
  saved: { attribute_id: string; option_id: string | null }[],
): { attribute_id: string; option_id?: string }[] {
  const byAttr = new Map(
    saved.map((r: { attribute_id: string; option_id: string | null }) => [
      r.attribute_id,
      r.option_id ?? undefined,
    ]),
  );
  return attrsWithOptions.map((a) => ({
    attribute_id: a.id,
    option_id: byAttr.get(a.id),
  }));
}

export function ProductEditView({
  product,
  categories,
  attributes,
}: ProductEditViewProps) {
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantModalMode, setVariantModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingVariant, setEditingVariant] =
    useState<ProductVariantForProductDetail | null>(null);

  const attributesWithOptions = useMemo(
    () => attributes.filter((a) => a.attribute_options.length > 0),
    [attributes],
  );

  const simpleEditInitial = useMemo(() => {
    const base = mapProductToFormInitials(product);
    return {
      ...base,
      attributeSelections: buildAttributeSelectionsForEdit(
        attributesWithOptions,
        product.product_attribute_values,
      ),
    };
  }, [product, attributesWithOptions]);

  const openCreateVariant = () => {
    setVariantModalMode("create");
    setEditingVariant(null);
    setVariantModalOpen(true);
  };

  const openEditVariant = (v: ProductVariantForProductDetail) => {
    setVariantModalMode("edit");
    setEditingVariant(v);
    setVariantModalOpen(true);
  };

  if (product.type === "SIMPLE") {
    return (
      <UpdateProductForm
        productId={product.id}
        initialProductType="SIMPLE"
        initialValues={simpleEditInitial}
        categories={categories}
        attributes={attributes}
      />
    );
  }

  if (!product.variant_group) {
    return null;
  }

  const variantLabel = product.variant_group.attributes
    .map((a) => a.attribute_name)
    .join(", ");

  const groupAttributes = product.variant_group.attributes;

  return (
    <>
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Product Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <VariantsTable
              groupAttributes={groupAttributes}
              variants={product.variant_group.variants}
              onAdd={openCreateVariant}
              onEdit={openEditVariant}
            />
          </CardContent>
        </Card>

        <UpdateProductForm
          productId={product.id}
          initialProductType="CONFIGURABLE"
          configurableDetailsOnly
          initialValues={mapProductToFormInitials(product)}
          categories={categories}
          attributes={attributes}
        />
      </div>

      <VariantModal
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        mode={variantModalMode}
        productId={product.id}
        variantGroupId={product.variant_group.id}
        groupAttributes={groupAttributes}
        catalogAttributes={attributesWithOptions}
        editingVariant={editingVariant}
      />
    </>
  );
}
