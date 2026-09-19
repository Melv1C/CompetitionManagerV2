import { UICoreProvider } from "@repo/ui";
import { getAuthRedirect } from "@repo/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { authClient } from "@/lib/auth-client";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
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
