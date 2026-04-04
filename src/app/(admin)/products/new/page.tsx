import { requireAdmin } from "@/dal/auth.dal";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
    </div>
  );
}
