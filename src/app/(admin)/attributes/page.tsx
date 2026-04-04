import { requireAdmin } from "@/dal/auth.dal";

export default async function AttributesPage() {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Attributes</h1>
    </div>
  );
}
