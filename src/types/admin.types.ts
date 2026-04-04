import type { Admin, AdminRole } from "./index";

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Columns loaded for shell UI (sidebar / header). */
export type AdminShellProfile = Pick<
  Admin,
  "id" | "user_id" | "role" | "full_name" | "contact_number" | "avatar_url"
>;

export type AdminContextValue = {
  role: AdminRole;
  admin: AdminShellProfile | null;
  /** Auth user email for display when admin row has no full_name. */
  email: string;
};
