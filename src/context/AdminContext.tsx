"use client";

import { createContext, useContext } from "react";

import type { AdminContextValue } from "@/types";

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  children,
  role,
  admin,
  email,
}: { children: React.ReactNode } & AdminContextValue) {
  return <AdminContext value={{ role, admin, email }}>{children}</AdminContext>;
}

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdminContext must be used within AdminProvider");
  }
  return ctx;
}
