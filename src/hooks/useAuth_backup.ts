// src/hooks/useAuth.ts
"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {};
  const router = useRouter();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await utils.auth.me.invalidate();
    router.push("/toronto");
  }, [utils, router]);

  const user = meQuery.data ?? null;
  const loading = meQuery.isLoading;
  const isAuthenticated = Boolean(user);

  if (redirectOnUnauthenticated && !loading && !user) {
    router.push("/toronto");
  }

  return { user, loading, isAuthenticated, logout, error: meQuery.error ?? null };
}
