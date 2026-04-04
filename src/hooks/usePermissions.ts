import { useAdminContext } from "@/context/AdminContext";

export function usePermissions() {
  const { role } = useAdminContext();
  return {
    can: (action: "mutate") =>
      action === "mutate" ? role === "super_admin" : false,
    isSuperAdmin: role === "super_admin",
    isTestAdmin: role === "test_admin",
  };
}
