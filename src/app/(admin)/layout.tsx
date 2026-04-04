import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminProvider } from "@/context/AdminContext";
import { getAdminById, requireAdmin } from "@/dal/auth.dal";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, role } = await requireAdmin();
  const admin = await getAdminById(user.id);

  return (
    <AdminProvider role={role} admin={admin} email={user.email ?? ""}>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
