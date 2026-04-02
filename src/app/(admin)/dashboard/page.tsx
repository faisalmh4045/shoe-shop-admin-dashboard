import { requireAdmin } from "@/dal/auth.dal";

export default async function DashboardPage() {
  await requireAdmin();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You&apos;re signed in.
      </p>
    </div>
  );
}
