import type { Database } from "./database.types";

// ── Row types (one per table) ─────────────────────────────────────────────
export type Admin = Database["public"]["Tables"]["admins"]["Row"];

// ── Enum types ────────────────────────────────────────────────────────────
export type AdminRole = Database["public"]["Enums"]["admin_role"];

// ── Re-export app-level types ─────────────────────────────────────────────
export type {
  ActionResult,
  AdminContextValue,
  AdminShellProfile,
} from "./admin.types";
