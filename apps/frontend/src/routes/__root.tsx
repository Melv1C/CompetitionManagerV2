import { RuntimeDevtoolsPanel, UICoreProvider } from "@repo/ui";
import { getAuthRedirect } from "@repo/utils";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { MockSessionProvider } from "@/components/frontend-prototype";
import { authClient } from "@/lib/auth-client";
import { frontendI18n } from "@/lib/frontend-i18n";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (
      /^\/(?:$|competitions(?:\/.*)?|results\/?$|registrations(?:\/.*)?|register\/?$|profile\/?)$/.test(
        location.pathname,
      )
    ) {
      return;
    }

    const sessionResult = await authClient.getSession().catch(() => null);
    const session = sessionResult?.data;
    const destination = getAuthRedirect(location.pathname, Boolean(session), [
      "/login",
      "/sign-up",
    ]);

    if (destination) {
      throw redirect({ to: destination });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const showDevtools = path === "/login" || path === "/sign-up";

  return (
    <QueryClientProvider client={queryClient}>
      <UICoreProvider i18nConfig={{ instance: frontendI18n }}>
        <MockSessionProvider>
          <Outlet />
        </MockSessionProvider>
      </UICoreProvider>
      {showDevtools && (
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
      )}
    </QueryClientProvider>
  );
}

function ProductRuntimeDevtoolsPanel() {
  const path = useRouterState({ select: (state) => state.location.href });
  return <RuntimeDevtoolsPanel application="Frontend" path={path} />;
}
