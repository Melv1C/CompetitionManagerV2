import { Card, CardContent, CardFooter, CardHeader, Skeleton } from "@repo/ui";

export function CompetitionCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <CardHeader className="grid grid-cols-[58px_1fr] gap-4">
        <Skeleton className="h-16 rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-11 w-32" />
      </CardFooter>
    </Card>
  );
}
