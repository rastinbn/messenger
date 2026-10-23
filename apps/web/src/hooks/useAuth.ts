"use client";

import type { LoginInput, RegisterInput } from "@messenger/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useServices } from "@/components/providers/ServiceProvider";

export function useSession() {
  const { auth } = useServices();
  return useQuery({
    queryKey: ["session"],
    queryFn: () => auth.getCurrentSession()
  });
}

export function useLogin() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: LoginInput) => auth.login(input),
    onSuccess: (session) => {
      queryClient.setQueryData(["session"], session);
      router.push("/chat");
    }
  });
}

export function useRegister() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: RegisterInput) => auth.register(input),
    onSuccess: (session) => {
      queryClient.setQueryData(["session"], session);
      router.push("/chat");
    }
  });
}

export function useLogout() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => auth.logout(),
    onSuccess: () => {
      queryClient.setQueryData(["session"], null);
      router.push("/login");
    }
  });
}

export function useResendVerificationEmail() {
  const { auth } = useServices();
  return useMutation({ mutationFn: () => auth.resendVerificationEmail() });
}

export function useConfirmEmailVerification() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => auth.confirmEmailVerification(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["currentUser"] })
  });
}

export function useRequestMagicLink() {
  const { auth } = useServices();
  return useMutation({ mutationFn: (email: string) => auth.requestMagicLink(email) });
}

export function useConsumeMagicLink() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (token: string) => auth.consumeMagicLink(token),
    onSuccess: (session) => {
      queryClient.setQueryData(["session"], session);
      router.push("/chat");
    }
  });
}
