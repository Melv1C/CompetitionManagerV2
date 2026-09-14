import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { AlertCircle, ChevronLeft, ChevronRight, Info, Loader2 } from "lucide-react";

import { useUsers } from "../use-users";
import { useUsersStore } from "../users-store";
import { UserRow } from "./user-row";

export function UsersTable() {
  const filter = useUsersStore((state) => state.filter);
  const setPage = useUsersStore((state) => state.setPage);
  const setFilter = useUsersStore((state) => state.setFilter);

  const { data, isPending, isError } = useUsers(filter);

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const currentPage = Math.floor(filter.offset / filter.limit);
  const totalPages = Math.ceil(total / filter.limit);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setFilter({ offset: (currentPage + 1) * filter.limit });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage your application users</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading users...</p>
          </div>
        )}

        {isError && (
          <div className="text-destructive flex flex-col items-center justify-center gap-3 py-12">
            <AlertCircle className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-medium">Failed to load users</p>
              <p className="text-muted-foreground mt-1 text-xs">Please try again later</p>
            </div>
          </div>
        )}

        {!isPending && !isError && users.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-12">
            <Info className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-medium">No users found</p>
              <p className="mt-1 text-xs">Try adjusting your filters</p>
            </div>
          </div>
        )}

        {!isPending && !isError && users.length > 0 && (
          <div className="space-y-4">
            <ScrollArea className="h-125">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-70">User</TableHead>
                    <TableHead className="w-30">Role</TableHead>
                    <TableHead className="w-25">Status</TableHead>
                    <TableHead className="w-25">Verified</TableHead>
                    <TableHead className="w-40">Created</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <UserRow key={user.id} user={user} />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                Page {currentPage + 1} of {totalPages}
              </p>
              <p className="text-xs">
                Showing {users.length} of {total} total users
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={handlePreviousPage}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={handleNextPage}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
