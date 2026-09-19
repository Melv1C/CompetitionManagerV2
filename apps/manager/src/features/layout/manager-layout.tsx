import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Logo,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarDays, ChevronsUpDown, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient, signOut, useSession } from "@/lib/auth-client";

type Organization = { id: string; name: string; slug: string };

export function ManagerLayout({ organizations }: { organizations: Organization[] }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const organizationId = pathname.match(/^\/organizations\/([^/]+)/)?.[1] ?? organizations[0]?.id;
  const activeOrganization = organizations.find(
    (organization) => organization.id === organizationId,
  );
  const [switching, setSwitching] = useState(false);

  const changeOrganization = async (nextOrganizationId: string) => {
    if (nextOrganizationId === organizationId) return;
    setSwitching(true);
    const result = await authClient.organization.setActive({ organizationId: nextOrganizationId });
    setSwitching(false);
    if (result.error) {
      toast.error(result.error.message ?? "Could not switch Organization");
      return;
    }
    await navigate({
      to: "/organizations/$organizationId/competitions",
      params: { organizationId: nextOrganizationId },
    });
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon" className="border-r-0">
        <SidebarHeader className="border-sidebar-border/70 gap-3 border-b p-3">
          <div className="flex items-center gap-2 px-1">
            <Logo />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">Competition Manager</p>
              <p className="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">
                Operations desk
              </p>
            </div>
          </div>
          <label className="group-data-[collapsible=icon]:hidden">
            <span className="sr-only">Organization</span>
            <select
              aria-label="Organization"
              value={organizationId}
              disabled={switching}
              onChange={(event) => void changeOrganization(event.target.value)}
              className="border-sidebar-border bg-sidebar-accent/60 focus:ring-sidebar-ring h-10 w-full rounded-lg border px-3 text-sm font-medium outline-none focus:ring-2"
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Meet operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {activeOrganization ? (
                    <SidebarMenuButton
                      render={
                        <Link
                          to="/organizations/$organizationId/competitions"
                          params={{ organizationId: activeOrganization.id }}
                        />
                      }
                      isActive={pathname.includes("/competitions")}
                      tooltip="Competitions"
                    >
                      <CalendarDays />
                      <span>Competitions</span>
                    </SidebarMenuButton>
                  ) : null}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <ManagerUser />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="manager-canvas overflow-hidden">
        <header className="bg-background/90 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{activeOrganization?.name}</p>
            <p className="text-muted-foreground text-xs">Competition setup</p>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ManagerUser() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const user = session?.user;
  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <SidebarMenuButton size="lg">
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                await navigate({ to: "/login" });
              }}
            >
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
