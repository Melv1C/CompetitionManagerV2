/* eslint-disable react/no-unescaped-entities */
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@repo/ui";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ROLES } from "../constants";
import { useSetUserRole, useUpdateUser, useUsers } from "../use-users";
import { useUsersStore } from "../users-store";

const roleItems = ROLES.map((role) => ({
  label: role.charAt(0).toUpperCase() + role.slice(1),
  value: role,
}));

export function EditUserDialog() {
  const isOpen = useUsersStore((state) => state.editDialogOpen);
  const closeDialog = useUsersStore((state) => state.closeEditDialog);
  const selectedUserId = useUsersStore((state) => state.selectedUserId);
  const filter = useUsersStore((state) => state.filter);

  const { data } = useUsers(filter);
  const user = data?.users.find((u) => u.id === selectedUserId);

  const updateUser = useUpdateUser();
  const setRole = useSetUserRole();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRoleValue] = useState("user");
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name);
      setEmail(user.email);
      setRoleValue(user.role);
      setEmailVerified(user.emailVerified);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !user) return;

    const hasInfoChanges =
      name.trim() !== user.name ||
      email.trim() !== user.email ||
      emailVerified !== user.emailVerified;
    const hasRoleChange = role !== user.role;

    if (hasInfoChanges) {
      await updateUser.mutateAsync({
        userId: selectedUserId,
        data: {
          name: name.trim(),
          email: email.trim(),
          emailVerified,
        },
      });
    }

    if (hasRoleChange) {
      await setRole.mutateAsync({
        userId: selectedUserId,
        role,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setRoleValue("user");
    setEmailVerified(false);
    closeDialog();
  };

  const isValid = name.trim() && email.trim();
  const isPending = updateUser.isPending || setRole.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information and role</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRoleValue(v ?? "user")} items={roleItems}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="edit-email-verified">Email Verified</Label>
              <p className="text-muted-foreground text-sm">Mark this user's email as verified</p>
            </div>
            <Switch
              id="edit-email-verified"
              checked={emailVerified}
              onCheckedChange={setEmailVerified}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
