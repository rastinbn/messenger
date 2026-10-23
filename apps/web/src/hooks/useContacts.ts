"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useServices } from "@/components/providers/ServiceProvider";

export function useContacts() {
  const { contacts } = useServices();
  return useQuery({ queryKey: ["contacts"], queryFn: () => contacts.listContacts() });
}

export function useAddContact() {
  const { contacts } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => contacts.addContact(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] })
  });
}

export function useRemoveContact() {
  const { contacts } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => contacts.removeContact(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] })
  });
}
