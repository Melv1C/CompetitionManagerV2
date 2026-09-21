import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Check, ChevronsUpDown, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient, signOut, useSession } from "@/lib/auth-client";

type Organization = { id: string; name: string; slug: string; logo?: string | null };

function organizationInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function OrganizationAvatar({ organization }: { organization: Organization }) {
  return (
    <Avatar className="size-8 rounded-lg">
      <AvatarImage src={organization.logo ?? undefined} alt="" className="rounded-lg" />
      <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xs font-semibold">
        {organizationInitials(organization.name)}
      </AvatarFallback>
    </Avatar>
  );
}

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
        <SidebarHeader className="border-sidebar-border/70 border-b p-2">
          {activeOrganization ? (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <SidebarMenuButton
                        size="lg"
                        aria-label={`Organization: ${activeOrganization.name}`}
                        disabled={switching}
                        className="border-sidebar-border/70 bg-sidebar-accent/45 data-popup-open:bg-sidebar-accent border shadow-xs"
                      />
                    }
                  >
                    <OrganizationAvatar organization={activeOrganization} />
                    <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="block truncate text-sm font-semibold">
                        {activeOrganization.name}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {activeOrganization.slug}
                      </span>
                    </div>
                    <ChevronsUpDown className="text-muted-foreground ml-auto group-data-[collapsible=icon]:hidden" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="bottom" className="min-w-64 rounded-xl">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {organizations.map((organization) => (
                        <DropdownMenuItem
                          key={organization.id}
                          disabled={switching}
                          onClick={() => void changeOrganization(organization.id)}
                          className="gap-2 p-2"
                        >
                          <OrganizationAvatar organization={organization} />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{organization.name}</span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {organization.slug}
                            </span>
                          </div>
                          {organization.id === organizationId ? (
                            <Check className="text-primary ml-auto size-4" />
                          ) : null}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : null}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-3">
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
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                aria-label={`Account: ${user.name}`}
                className="data-popup-open:bg-sidebar-accent h-10"
              />
            }
          >
            <Avatar size="sm" className="rounded-md">
              <AvatarImage src={user.image ?? undefined} alt="" className="rounded-md" />
              <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <p className="block truncate text-xs font-medium">{user.name}</p>
              <p className="text-muted-foreground block truncate text-[11px]">{user.email}</p>
            </div>
            <ChevronsUpDown className="text-muted-foreground ml-auto size-3.5 group-data-[collapsible=icon]:hidden" />
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
