import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui";
import { Loader2 } from "lucide-react";

import { useRemoveUser, useUsers } from "../use-users";
import { useUsersStore } from "../users-store";

export function DeleteUserDialog() {
  const isOpen = useUsersStore((state) => state.deleteDialogOpen);
  const closeDialog = useUsersStore((state) => state.closeDeleteDialog);
  const selectedUserId = useUsersStore((state) => state.selectedUserId);
  const filter = useUsersStore((state) => state.filter);

  const { data } = useUsers(filter);
  const user = data?.users.find((u) => u.id === selectedUserId);

  const removeUser = useRemoveUser();

  const handleDelete = async () => {
    if (!selectedUserId) return;

    await removeUser.mutateAsync(selectedUserId);
    closeDialog();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete <strong>{user?.name ?? "this user"}</strong>
            ? This action cannot be undone and will remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={removeUser.isPending}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {removeUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
