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
} from "@repo/ui";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { useBanUser, useUsers } from "../use-users";
import { useUsersStore } from "../users-store";

const BAN_DURATIONS = [
  { label: "Permanent", value: "permanent" },
  { label: "1 hour", value: "3600" },
  { label: "24 hours", value: "86400" },
  { label: "7 days", value: "604800" },
  { label: "30 days", value: "2592000" },
  { label: "90 days", value: "7776000" },
] as const;

export function BanUserDialog() {
  const isOpen = useUsersStore((state) => state.banDialogOpen);
  const closeDialog = useUsersStore((state) => state.closeBanDialog);
  const selectedUserId = useUsersStore((state) => state.selectedUserId);
  const filter = useUsersStore((state) => state.filter);

  const { data } = useUsers(filter);
  const user = data?.users.find((u) => u.id === selectedUserId);

  const banUser = useBanUser();

  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("permanent");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    await banUser.mutateAsync({
      userId: selectedUserId,
      banReason: reason.trim() || undefined,
      banExpiresIn: duration === "permanent" ? undefined : parseInt(duration, 10),
    });

    handleClose();
  };

  const handleClose = () => {
    setReason("");
    setDuration("permanent");
    closeDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            Ban <strong>{user?.name ?? "this user"}</strong> from accessing the application. This
            will revoke all their active sessions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Reason (optional)</Label>
            <Input
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter ban reason..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ban-duration">Duration</Label>
            <Select
              value={duration}
              onValueChange={(v) => setDuration(v ?? "permanent")}
              items={BAN_DURATIONS}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAN_DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={banUser.isPending}>
              {banUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ban User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
