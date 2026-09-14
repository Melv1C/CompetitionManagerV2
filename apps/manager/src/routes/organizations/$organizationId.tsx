import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ENV } from "varlock/env";

type Organization = { id: string; name: string; slug: string };

export const Route = createFileRoute("/organizations/$organizationId")({
  component: OrganizationDashboard,
});

function OrganizationDashboard() {
  const { organizationId } = Route.useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    void fetch(`${ENV.API_URL}/api/organizations/${organizationId}/dashboard`, {
      credentials: "include",
    }).then(async (response) => {
      if (response.status === 403 || response.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (!response.ok) {
        setError(true);
        return;
      }
      setOrganization((await response.json()) as Organization);
    });
  }, [organizationId]);

  if (unauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>You do not have access to this organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4"
              href="/"
            >
              Return to manager
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <p className="p-6">Organization dashboard is unavailable.</p>;
  }

  if (!organization) {
    return <p className="p-6">Loading organization dashboard...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>{organization.name}</CardTitle>
          <CardDescription>Organization administration dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Organization slug: {organization.slug}</p>
        </CardContent>
      </Card>
    </div>
  );
}
