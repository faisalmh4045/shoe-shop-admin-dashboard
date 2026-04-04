"use client";

import Link from "next/link";
import { toast } from "sonner";

import { logout } from "@/actions/auth.actions";
import { useAdmin } from "@/hooks/useAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SettingsIcon, UserRoundIcon } from "lucide-react";

import { ThemeToggle } from "./theme-toggle";

function displayName(
  fullName: string | null | undefined,
  email: string,
): string {
  if (fullName?.trim()) return fullName.trim();
  const local = email.split("@")[0];
  return local || "Admin";
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "AD";
}

export function AdminHeader() {
  const { admin, email } = useAdmin();
  const name = displayName(admin?.full_name, email);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative size-8 rounded-full p-0"
                aria-label="Account menu"
              >
                <Avatar className="size-8">
                  <AvatarImage
                    src={admin?.avatar_url ?? undefined}
                    alt={name}
                  />
                  <AvatarFallback className="text-xs">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">{name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/edit-profile" className="cursor-pointer">
                    <UserRoundIcon className="mr-2 size-4" />
                    Edit profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <SettingsIcon className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  void (async () => {
                    try {
                      const result = await logout();
                      if (!result.success) toast.error(result.error);
                    } catch {
                      /* redirect() throws on successful sign-out */
                    }
                  })();
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
