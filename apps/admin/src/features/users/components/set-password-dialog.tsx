import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@repo/ui";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { useSetUserPassword, useUsers } from "../use-users";
import { useUsersStore } from "../users-store";

export function SetPasswordDialog() {
  const isOpen = useUsersStore((state) => state.setPasswordDialogOpen);
  const closeDialog = useUsersStore((state) => state.closeSetPasswordDialog);
  const selectedUserId = useUsersStore((state) => state.selectedUserId);
  const filter = useUsersStore((state) => state.filter);

  const { data } = useUsers(filter);
  const user = data?.users.find((u) => u.id === selectedUserId);

  const setPassword = useSetUserPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    await setPassword.mutateAsync({
      userId: selectedUserId,
      newPassword,
    });

    handleClose();
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    closeDialog();
  };

  const isValid = newPassword.length >= 8 && newPassword === confirmPassword;
  const passwordsMatch = newPassword === confirmPassword || confirmPassword === "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Password</DialogTitle>
          <DialogDescription>
            Set a new password for <strong>{user?.name ?? "this user"}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              className={!passwordsMatch ? "border-destructive" : ""}
            />
            {!passwordsMatch && <p className="text-destructive text-xs">Passwords do not match</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || setPassword.isPending}>
              {setPassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
