import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { AlertCircle, Building2, Loader2, Plus } from "lucide-react";

import { useOrganizations } from "../use-organizations";

type OrganizationsTableProps = {
  onCreate: () => void;
};

export function OrganizationsTable({ onCreate }: OrganizationsTableProps) {
  const organizations = useOrganizations();

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle role="heading" aria-level={1}>
            Organizations
          </CardTitle>
          <CardDescription>
            Create organizations and assign the user responsible for managing each one.
          </CardDescription>
        </div>
        <Button onClick={onCreate} className="gap-2 sm:shrink-0">
          <Plus className="size-4" />
          Create organization
        </Button>
      </CardHeader>
      <CardContent>
        {organizations.isPending && (
          <div className="flex items-center justify-center gap-3 py-14">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading organizations...</p>
          </div>
        )}

        {organizations.isError && (
          <div className="text-destructive flex items-center justify-center gap-3 py-14">
            <AlertCircle className="size-6" />
            <p className="text-sm font-medium">Failed to load organizations</p>
          </div>
        )}

        {organizations.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="bg-muted grid size-12 place-items-center rounded-xl">
              <Building2 className="text-muted-foreground size-6" />
            </div>
            <div>
              <p className="font-medium">No organizations yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Create the first organization and choose its owner.
              </p>
            </div>
          </div>
        )}

        {organizations.data && organizations.data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.data.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell className="font-medium">{organization.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {organization.slug}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{organization.owner.name}</p>
                      <p className="text-muted-foreground text-xs">{organization.owner.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {organization.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
