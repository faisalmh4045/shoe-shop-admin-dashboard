import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AdminRole, AdminShellProfile } from "@/types";

export const requireAdmin = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/unauthorized");
  }

  return { user, role: admin.role as AdminRole };
});

export const getAdminById = cache(
  async (userId: string): Promise<AdminShellProfile | null> => {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("admins")
      .select("id, user_id, role, full_name, contact_number, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
);
