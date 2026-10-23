"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "@/lib/api/admin";

export function useAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminApi.getStats() });
}

export function useAdminUsers(page: number, pageSize: number, query?: string) {
  return useQuery({
    queryKey: ["admin", "users", page, pageSize, query],
    queryFn: () => adminApi.listUsers(page, pageSize, query)
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
  });
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.unsuspendUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: "user" | "admin" }) => adminApi.setUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    }
  });
}

export function useAdminConversations(page: number, pageSize: number) {
  return useQuery({
    queryKey: ["admin", "conversations", page, pageSize],
    queryFn: () => adminApi.listConversations(page, pageSize)
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    }
  });
}
