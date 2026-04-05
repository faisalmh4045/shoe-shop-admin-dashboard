import { ProductForm } from "@/components/products/product-form";
import { getAttributesWithOptionsForProductForm } from "@/dal/attributes.dal";
import { requireAdmin } from "@/dal/auth.dal";
import { getCategoriesForProductForm } from "@/dal/categories.dal";

export default async function NewProductPage() {
  await requireAdmin();

  const [categories, attributes] = await Promise.all([
    getCategoriesForProductForm(),
    getAttributesWithOptionsForProductForm(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
      <ProductForm categories={categories} attributes={attributes} />
    </div>
  );
}
