import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui";
import type { User as UserType } from "@repo/utils";
import {
  AlertCircle,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Globe,
  Loader2,
  Mail,
  Monitor,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { formatDate, formatRelativeTime, getInitials, getRoleConfig } from "../constants";
import { useRevokeAllSessions, useRevokeSession, useUsers, useUserSessions } from "../use-users";
import { useUsersStore } from "../users-store";

function UserInfo({ user }: { user: UserType }) {
  const roleConfig = getRoleConfig(user.role);
  const isBanned = user.banned === true;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-card flex items-center gap-4 rounded-lg border p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback className="text-lg">
            {user.name ? getInitials(user.name) : <User className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{user.name}</h3>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={roleConfig.variant} className="capitalize">
              {user.role === "admin" && <ShieldCheck className="mr-1 h-3 w-3" />}
              {roleConfig.label}
            </Badge>
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
            {user.emailVerified ? (
              <Badge
                variant="secondary"
                className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                <CheckCircle className="h-3 w-3" />
                Email Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <XCircle className="h-3 w-3" />
                Email Unverified
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-md border p-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <Mail className="h-3 w-3" />
            Email
          </div>
          <p className="text-sm font-medium break-all">{user.email}</p>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <Calendar className="h-3 w-3" />
            Created
          </div>
          <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <Clock className="h-3 w-3" />
            Last Updated
          </div>
          <p className="text-sm font-medium">{formatRelativeTime(user.updatedAt)}</p>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <User className="h-3 w-3" />
            User ID
          </div>
          <p className="truncate font-mono text-xs">{user.id}</p>
        </div>
      </div>

      {/* Ban Info */}
      {isBanned && (
        <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
          <h4 className="text-destructive mb-2 text-sm font-semibold">Ban Information</h4>
          <div className="space-y-2 text-sm">
            {user.banReason && (
              <p>
                <span className="text-muted-foreground">Reason:</span> {user.banReason}
              </p>
            )}
            {user.banExpires && (
              <p>
                <span className="text-muted-foreground">Expires:</span>{" "}
                {formatDate(user.banExpires)}
              </p>
            )}
            {!user.banExpires && <p className="text-muted-foreground italic">Permanent ban</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function UserSessions({ userId }: { userId: string }) {
  const { data: sessions, isPending, isError } = useUserSessions(userId);
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive flex flex-col items-center justify-center gap-2 py-8">
        <AlertCircle className="h-6 w-6" />
        <p className="text-sm">Failed to load sessions</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <p className="text-sm">No active sessions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Active Sessions ({sessions.length})</h4>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => revokeAllSessions.mutate(userId)}
          disabled={revokeAllSessions.isPending}
        >
          Revoke All
        </Button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="bg-muted/30 rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Monitor className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="truncate">{session.userAgent ?? "Unknown device"}</span>
                </div>
                {session.ipAddress && (
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span>{session.ipAddress}</span>
                  </div>
                )}
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>Created {formatRelativeTime(session.createdAt)}</span>
                </div>
                {session.impersonatedBy && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Impersonated
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeSession.mutate(session.token)}
                disabled={revokeSession.isPending}
                className="shrink-0"
              >
                Revoke
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserDetailSheet() {
  const selectedUserId = useUsersStore((state) => state.selectedUserId);
  const sheetOpen = useUsersStore((state) => state.sheetOpen);
  const setSheetOpen = useUsersStore((state) => state.setSheetOpen);
  const filter = useUsersStore((state) => state.filter);

  const { data } = useUsers(filter);
  const user = data?.users.find((u) => u.id === selectedUserId);

  const handleOpenChange = (open: boolean) => {
    setSheetOpen(open);
  };

  if (!selectedUserId) {
    return null;
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>View and manage user information</SheetDescription>
        </SheetHeader>

        <div className="overflow-scroll px-6 pb-6">
          {user ? (
            <div className="space-y-6 pt-4">
              <UserInfo user={user} />
              <div className="border-t pt-6">
                <UserSessions userId={user.id} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
