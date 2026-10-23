"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useServices } from "@/components/providers/ServiceProvider";

export function useNotifications() {
  const { notifications } = useServices();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notifications.listNotifications(),
    refetchInterval: 20_000
  });
}

export function useMarkAllNotificationsRead() {
  const { notifications } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });
}

export function useMarkNotificationRead() {
  const { notifications } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notifications.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });
}
