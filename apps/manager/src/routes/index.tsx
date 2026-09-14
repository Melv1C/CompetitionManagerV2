import { CardHealth, Logo } from "@repo/ui";
import { APP_NAME } from "@repo/utils";
import { createFileRoute } from "@tanstack/react-router";
import { ENV } from "varlock/env";

import { useAPIHealth } from "@/hooks/use-api-health";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isPending, isError, refetch } = useAPIHealth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-4">
      <Logo />
      <h1 className="text-3xl font-bold">Welcome to {APP_NAME}</h1>
      <p className="text-gray-700">Environment: {ENV.APP_ENV}</p>
      <div className="mt-4">
        <CardHealth className="w-64" isPending={isPending} isError={isError} refetch={refetch} />
      </div>
    </div>
  );
}
