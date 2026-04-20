"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  PackageIcon,
  PlusCircleIcon,
  FolderTreeIcon,
  LayersIcon,
  ShoppingCartIcon,
  UsersIcon,
  Settings2Icon,
  HashIcon,
  MessageSquareIcon,
} from "lucide-react";

function routeActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/products/new") {
    return (
      pathname === "/products/new" || pathname.startsWith("/products/new/")
    );
  }
  if (href === "/products") {
    if (pathname === "/products") return true;
    if (
      pathname.startsWith("/products/") &&
      !pathname.startsWith("/products/new")
    ) {
      return true;
    }
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavItem = { title: string; href: string; icon: ReactNode };

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={routeActive(pathname, item.href)}
                tooltip={item.title}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const quickLinks: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboardIcon className="size-4" />,
  },
  {
    title: "New product",
    href: "/products/new",
    icon: <PlusCircleIcon className="size-4" />,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: <MessageSquareIcon className="size-4" />,
  },
];

const catalog: NavItem[] = [
  {
    title: "Products",
    href: "/products",
    icon: <PackageIcon className="size-4" />,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: <FolderTreeIcon className="size-4" />,
  },
  {
    title: "Collections",
    href: "/collections",
    icon: <LayersIcon className="size-4" />,
  },
  {
    title: "Attributes",
    href: "/attributes",
    icon: <HashIcon className="size-4" />,
  },
];

const sale: NavItem[] = [
  {
    title: "Orders",
    href: "/orders",
    icon: <ShoppingCartIcon className="size-4" />,
  },
];

const customer: NavItem[] = [
  {
    title: "Customers",
    href: "/customers",
    icon: <UsersIcon className="size-4" />,
  },
];

export function SidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <>
      <NavGroup label="Quick links" items={quickLinks} pathname={pathname} />
      <NavGroup label="Catalog" items={catalog} pathname={pathname} />
      <NavGroup label="Sale" items={sale} pathname={pathname} />
      <NavGroup label="Customer" items={customer} pathname={pathname} />
      <SidebarGroup className="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={routeActive(pathname, "/settings")}
                tooltip="Settings"
              >
                <Link href="/settings">
                  <Settings2Icon className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
