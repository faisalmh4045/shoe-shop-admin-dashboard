import { requireAdmin } from "@/dal/auth.dal";

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
    </div>
  );
}
