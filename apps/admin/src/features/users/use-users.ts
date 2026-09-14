import { Session$, User$, type Session, type User, type UserRole } from "@repo/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import type { UsersFilter } from "./users-store";

const USERS_QUERY_KEY = "users";
const USERS_STALE_TIME = 30_000;
const USERS_CACHE_TIME = 5 * 60 * 1000;

export function useUsers(filter: UsersFilter) {
  return useQuery({
    queryKey: [
      USERS_QUERY_KEY,
      filter.searchValue,
      filter.searchField,
      filter.role,
      filter.banned,
      filter.limit,
      filter.offset,
      filter.sortBy,
      filter.sortDirection,
    ],
    queryFn: async () => {
      const response = await authClient.admin.listUsers({
        query: {
          searchValue: filter.searchValue || undefined,
          searchField: filter.searchField,
          searchOperator: "contains",
          limit: filter.limit,
          offset: filter.offset,
          sortBy: filter.sortBy,
          sortDirection: filter.sortDirection,
          filterField: filter.role ? "role" : filter.banned !== null ? "banned" : undefined,
          filterValue: filter.role ?? (filter.banned !== null ? filter.banned : undefined),
          filterOperator: "eq",
        },
      });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to fetch users");
      }

      return {
        users: response.data.users.map((u) => User$.parse(u)) ?? [],
        total: response.data.total ?? 0,
        limit: "limit" in response.data ? response.data?.limit : undefined,
        offset: "offset" in response.data ? response.data?.offset : undefined,
      };
    },
    placeholderData: (prev) => prev,
    staleTime: USERS_STALE_TIME,
    gcTime: USERS_CACHE_TIME,
  });
}

export function useUserSessions(userId: string | null) {
  return useQuery({
    queryKey: ["user-sessions", userId],
    queryFn: async (): Promise<Session[]> => {
      if (!userId) throw new Error("No user ID");

      const response = await authClient.admin.listUserSessions({ userId });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to fetch sessions");
      }

      return response.data.sessions.map((s) => Session$.parse(s)) ?? [];
    },
    enabled: !!userId,
    staleTime: USERS_STALE_TIME,
    gcTime: USERS_CACHE_TIME,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: User["name"];
      email: User["email"];
      password: string;
      role: UserRole;
    }) => {
      const response = await authClient.admin.createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to create user");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Record<string, unknown> }) => {
      const response = await authClient.admin.updateUser({ userId, data });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to update user");
      }

      return User$.parse(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await authClient.admin.setRole({ userId, role: role as "admin" | "user" });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to set role");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("Role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await authClient.admin.setUserPassword({ userId, newPassword });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to set password");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("Password updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      banReason,
      banExpiresIn,
    }: {
      userId: string;
      banReason?: string;
      banExpiresIn?: number;
    }) => {
      const response = await authClient.admin.banUser({
        userId,
        banReason,
        banExpiresIn,
      });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to ban user");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User banned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.unbanUser({ userId });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to unban user");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User unbanned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.removeUser({ userId });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to delete user");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionToken: string) => {
      const response = await authClient.admin.revokeUserSession({ sessionToken });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to revoke session");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast.success("Session revoked successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.revokeUserSessions({ userId });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to revoke sessions");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast.success("All sessions revoked successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.impersonateUser({ userId });

      if (response.error) {
        throw new Error(response.error.message ?? "Failed to impersonate user");
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Now impersonating user. Redirecting...");
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
