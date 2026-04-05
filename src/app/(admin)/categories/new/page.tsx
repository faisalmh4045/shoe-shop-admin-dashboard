import { CategoryForm } from "@/components/categories/category-form";
import { requireAdmin } from "@/dal/auth.dal";

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Create a new category
      </h1>
      <CategoryForm />
    </div>
  );
}
