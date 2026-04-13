import { notFound } from "next/navigation";

import { ProductEditView } from "@/components/products/product-edit-view";
import { getAttributesWithOptionsForProductForm } from "@/dal/attributes.dal";
import { requireAdmin } from "@/dal/auth.dal";
import { getCategoriesForProductForm } from "@/dal/categories.dal";
import { getProductById } from "@/dal/products.dal";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const product = await getProductById(id);
  if (!product) notFound();

  const [categories, attributes] = await Promise.all([
    getCategoriesForProductForm(),
    getAttributesWithOptionsForProductForm(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
        <p className="mt-1 text-sm text-muted-foreground">{product.title}</p>
      </div>
      <ProductEditView
        product={product}
        categories={categories}
        attributes={attributes}
      />
    </div>
  );
}
