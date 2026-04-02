import type { ReactNode } from "react";
import Link from "next/link";

import { requireAdmin } from "@/dal/auth.dal";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
