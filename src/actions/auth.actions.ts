"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { LoginSchema } from "@/validations/auth.validations";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

export async function login(formData: FormData): Promise<ActionResult<null>> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) return { success: false, error: "Invalid email or password." };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: "Unable to sign out." };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
