import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from "@repo/ui";
import type { User as UserType } from "@repo/utils";
import {
  Ban,
  CheckCircle,
  Eye,
  Key,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  Unlock,
  User,
  UserCog,
  XCircle,
} from "lucide-react";
import { memo } from "react";

import { formatRelativeTime, getInitials, getRoleConfig } from "../constants";
import { useImpersonateUser, useUnbanUser } from "../use-users";
import { useUsersStore } from "../users-store";

interface UserRowProps {
  user: UserType;
}

export const UserRow = memo(function UserRow({ user }: UserRowProps) {
  const roleConfig = getRoleConfig(user.role);
  const isBanned = user.banned === true;

  const setSelectedUserId = useUsersStore((state) => state.setSelectedUserId);
  const setSheetOpen = useUsersStore((state) => state.setSheetOpen);
  const openEditDialog = useUsersStore((state) => state.openEditDialog);
  const openSetPasswordDialog = useUsersStore((state) => state.openSetPasswordDialog);
  const openBanDialog = useUsersStore((state) => state.openBanDialog);
  const openDeleteDialog = useUsersStore((state) => state.openDeleteDialog);
  const openSessionsDialog = useUsersStore((state) => state.openSessionsDialog);

  const impersonateMutation = useImpersonateUser();
  const unbanMutation = useUnbanUser();

  const handleViewDetails = () => {
    setSelectedUserId(user.id);
    setSheetOpen(true);
  };

  const handleImpersonate = () => {
    impersonateMutation.mutate(user.id);
  };

  const handleUnban = () => {
    unbanMutation.mutate(user.id);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>
              {user.name ? getInitials(user.name) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={roleConfig.variant} className="capitalize">
          {user.role === "admin" && <ShieldCheck className="mr-1 h-3 w-3" />}
          {roleConfig.label}
        </Badge>
      </TableCell>
      <TableCell>
        {isBanned ? (
          <Badge variant="destructive" className="gap-1">
            <Ban className="h-3 w-3" />
            Banned
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            Active
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {user.emailVerified ? (
          <Badge
            variant="secondary"
            className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <XCircle className="h-3 w-3" />
            Unverified
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">{formatRelativeTime(user.createdAt)}</span>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleViewDetails}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(user.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openSetPasswordDialog(user.id)}>
              <Key className="mr-2 h-4 w-4" />
              Set Password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openSessionsDialog(user.id)}>
              <UserCog className="mr-2 h-4 w-4" />
              Manage Sessions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.role !== "admin" && (
              <DropdownMenuItem onClick={handleImpersonate}>
                <User className="mr-2 h-4 w-4" />
                Impersonate
              </DropdownMenuItem>
            )}
            {isBanned ? (
              <DropdownMenuItem onClick={handleUnban}>
                <Unlock className="mr-2 h-4 w-4" />
                Unban User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => openBanDialog(user.id)}>
                <Ban className="mr-2 h-4 w-4" />
                Ban User
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => openDeleteDialog(user.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
