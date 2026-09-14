import { UserRole$, type UserRole } from "@repo/utils";

export const ROLES: UserRole[] = UserRole$.options;

export const PAGE_SIZES = [10, 25, 50] as const;

export const roleConfig: Record<
  UserRole,
  {
    label: string;
    color: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  admin: {
    label: "Admin",
    color: "text-purple-600 dark:text-purple-400",
    variant: "default",
  },
  user: {
    label: "User",
    color: "text-gray-600 dark:text-gray-400",
    variant: "secondary",
  },
};

export function getRoleConfig(role: UserRole | undefined) {
  if (!role) {
    return roleConfig.user;
  }
  return roleConfig[role];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
