import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  CheckCircle,
  Database,
  ExternalLink,
  RefreshCw,
  Server,
  Users,
  XCircle,
} from "lucide-react";
import { ENV } from "varlock/env";

import { useAPIHealth } from "@/features/api-health";
import { APP_VERSION } from "@/lib/app-version";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data, isPending, isError, refetch, isFetching } = useAPIHealth();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Server className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(isPending || isFetching) && (
                  <>
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span className="text-muted-foreground text-sm">Checking...</span>
                  </>
                )}
                {!isFetching && isError && (
                  <>
                    <XCircle className="text-destructive h-4 w-4" />
                    <span className="text-destructive text-sm">Offline</span>
                  </>
                )}
                {!isFetching && data && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Online</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Retry connection"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Version</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v{APP_VERSION}</div>
            <p className="text-muted-foreground text-xs">Current version</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="/users"
              className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              <div className="bg-primary/10 rounded-lg p-2">
                <Users className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Manage Users</h3>
                <p className="text-muted-foreground text-sm">
                  Create, edit, and manage application users
                </p>
              </div>
            </a>
            <a
              href="/organizations"
              className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              <div className="bg-primary/10 rounded-lg p-2">
                <Building2 className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Manage Organizations</h3>
                <p className="text-muted-foreground text-sm">
                  Create organizations and assign their owners
                </p>
              </div>
            </a>
            <a
              href="/prisma-studio"
              className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              <div className="bg-primary/10 rounded-lg p-2">
                <Database className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Prisma Studio</h3>
                <p className="text-muted-foreground text-sm">Browse and edit database records</p>
              </div>
            </a>
            <a
              href={ENV.FRONTEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              <div className="bg-primary/10 rounded-lg p-2">
                <ExternalLink className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Frontend App</h3>
                <p className="text-muted-foreground text-sm">Open the main application</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
