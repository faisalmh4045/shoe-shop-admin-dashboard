import { requireAdmin } from "@/dal/auth.dal";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col gap-2 p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
      <p className="text-sm text-muted-foreground">
        Product ID: <span className="font-mono">{id}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Product form will be available here.
      </p>
    </div>
  );
}
