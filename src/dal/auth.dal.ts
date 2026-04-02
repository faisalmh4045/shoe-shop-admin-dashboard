import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types";

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
