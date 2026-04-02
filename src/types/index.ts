import type { Database } from "./database.types";

// Derived table/enum row types
export type Admin = Database["public"]["Tables"]["admins"]["Row"];
export type AdminRole = Database["public"]["Enums"]["admin_role"];

// App-level types
export type { ActionResult } from "./admin.types";
