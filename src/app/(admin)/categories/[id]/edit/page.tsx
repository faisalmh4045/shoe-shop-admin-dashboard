import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/categories/category-form";
import { requireAdmin } from "@/dal/auth.dal";
import { getCategoryById } from "@/dal/categories.dal";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit category</h1>
      <CategoryForm
        categoryId={category.id}
        defaultValues={{
          title: category.title,
          slug: category.slug,
          description: category.description ?? "",
          image: category.image ?? "",
          status: category.status,
          include_in_nav: category.include_in_nav,
          sort_order: category.sort_order,
        }}
      />
    </div>
  );
}
