import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { Database, LayoutDashboard, Users } from "lucide-react";

import type { NavItem } from "../type";
import { AppSidebar } from "./app-sidebar";

const navItems: NavItem[] = [
  {
    url: "/",
    title: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    url: "/users",
    title: "Users",
    icon: Users,
  },
  {
    url: "/prisma-studio",
    title: "Prisma Studio",
    icon: Database,
  },
];

export function AdminLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const currentPage = navItems.find((item) =>
    item.url === "/" ? currentPath === "/" : currentPath.startsWith(item.url),
  );

  if (!currentPage) {
    throw new Error(`No nav item found for path: ${currentPath}`);
  }

  return (
    <SidebarProvider>
      <AppSidebar navItems={navItems} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPage?.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex h-full flex-col space-y-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
