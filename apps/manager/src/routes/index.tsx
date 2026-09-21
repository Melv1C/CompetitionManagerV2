import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    const organization = context.organizations[0];
    if (organization) {
      throw redirect({
        to: "/organizations/$organizationId/competitions",
        params: { organizationId: organization.id },
      });
    }
  },
  component: EmptyOrganization,
});

function EmptyOrganization() {
  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">No Organization available</h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          Ask an Organization Owner to add this account before using the manager.
        </p>
      </div>
    </div>
  );
}
