import { RuntimeDevtoolsPanel, UICoreProvider } from "@repo/ui";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { ManagerLayout } from "@/features/layout";
import { authClient } from "@/lib/auth-client";
import { getManagerAuthRedirect } from "@/lib/auth-routing";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const sessionResult = await authClient.getSession().catch(() => null);
    const session = sessionResult?.data;
    const organizationsResult = session?.user.emailVerified
      ? await authClient.organization.list()
      : null;

    if (organizationsResult?.error) {
      throw new Error(
        organizationsResult.error.message ?? "We couldn't verify your organization access.",
      );
    }

    const hasOrganization = Boolean(organizationsResult?.data?.length);
    const destination = getManagerAuthRedirect(
      location.pathname,
      Boolean(session),
      Boolean(session?.user.emailVerified),
      hasOrganization,
    );

    if (destination) {
      throw redirect({ to: destination });
    }

    return {
      isPublicPage: location.pathname === "/login" || location.pathname === "/unauthorized",
      organizations: organizationsResult?.data ?? [],
    };
  },
  component: RootComponent,
});

function RootComponent() {
  const { isPublicPage, organizations } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <UICoreProvider i18nConfig={{ locale: "en" }}>
        {isPublicPage ? <Outlet /> : <ManagerLayout organizations={organizations} />}
      </UICoreProvider>
      <TanStackDevtools
        plugins={[
          { id: "query", name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
          { id: "router", name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
          {
            id: "runtime",
            name: "Competition Manager",
            render: <ProductRuntimeDevtoolsPanel />,
          },
        ]}
      />
    </QueryClientProvider>
  );
}

function ProductRuntimeDevtoolsPanel() {
  const path = useRouterState({ select: (state) => state.location.href });
  return <RuntimeDevtoolsPanel application="Manager" path={path} />;
}
