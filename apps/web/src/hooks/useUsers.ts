"use client";

import type { User, UserStatus } from "@messenger/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useServices } from "@/components/providers/ServiceProvider";

export function useCurrentUser() {
  const { user } = useServices();
  return useQuery({ queryKey: ["currentUser"], queryFn: () => user.getCurrentUser() });
}

export function useUpdateProfile() {
  const { user } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Pick<User, "displayName" | "avatarUrl" | "statusMessage">>) =>
      user.updateProfile(patch),
    onSuccess: (updated) => queryClient.setQueryData(["currentUser"], updated)
  });
}

export function useUpdateStatus() {
  const { user } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: UserStatus) => user.updateStatus(status),
    onSuccess: (updated) => queryClient.setQueryData(["currentUser"], updated)
  });
}

export function useUserSearch(query: string) {
  const { user } = useServices();
  return useQuery({
    queryKey: ["userSearch", query],
    queryFn: () => user.searchUsers(query),
    enabled: query.trim().length > 0
  });
}

export function usePublicProfile(userId: string) {
  const { user } = useServices();
  return useQuery({
    queryKey: ["publicProfile", userId],
    queryFn: () => user.getUser(userId)
  });
}
