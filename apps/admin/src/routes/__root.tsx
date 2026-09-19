import { RuntimeDevtoolsPanel, UICoreProvider } from "@repo/ui";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { AdminLayout } from "@/features/layout";
import { authClient } from "@/lib/auth-client";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const sessionResult = await authClient.getSession().catch(() => null);
    const session = sessionResult?.data;
    const isPublicPage = location.pathname === "/login" || location.pathname === "/unauthorized";

    if (!session && !isPublicPage) {
      throw redirect({ to: "/login" });
    }

    if (session && location.pathname === "/login") {
      throw redirect({ to: "/" });
    }

    const isAdmin = session?.user?.role === "admin";
    if (session && !isAdmin && !isPublicPage) {
      throw redirect({ to: "/unauthorized" });
    }

    return { isPublicPage };
  },
  component: RootComponent,
});

function RootComponent() {
  const { isPublicPage } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <UICoreProvider i18nConfig={{ locale: "en" }}>
        {isPublicPage ? <Outlet /> : <AdminLayout />}
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
  return <RuntimeDevtoolsPanel application="Admin" path={path} />;
}
