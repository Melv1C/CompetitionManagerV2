import { Activity, CheckCircle, RefreshCw, Server, XCircle } from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type CardHealthProps = React.ComponentProps<typeof Card> & {
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

export const CardHealth = ({ isPending, isError, refetch, ...props }: CardHealthProps) => {
  return (
    <Card {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Backend Status</CardTitle>
        <Server className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Activity className="h-4 w-4 animate-pulse" />
                <span className="text-muted-foreground text-sm">Checking...</span>
              </>
            )}
            {isError && (
              <>
                <XCircle className="text-destructive h-4 w-4" />
                <span className="text-destructive text-sm">Offline</span>
              </>
            )}
            {!isPending && !isError && (
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
            disabled={isPending}
            title="Retry connection"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
