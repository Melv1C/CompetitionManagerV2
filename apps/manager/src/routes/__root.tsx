import { UICoreProvider } from "@repo/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { authClient } from "@/lib/auth-client";
import { getManagerAuthRedirect } from "@/lib/auth-routing";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const sessionResult = await authClient.getSession().catch(() => null);
    const session = sessionResult?.data;
    const organizationsResult = session
      ? await authClient.organization.list().catch(() => null)
      : null;
    const hasOrganization = Boolean(organizationsResult?.data?.length);
    const destination = getManagerAuthRedirect(
      location.pathname,
      Boolean(session),
      hasOrganization,
    );

    if (destination) {
      throw redirect({ to: destination });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <UICoreProvider i18nConfig={{ locale: "en" }}>
        <Outlet />
      </UICoreProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <TanStackRouterDevtools />
    </QueryClientProvider>
  );
}
