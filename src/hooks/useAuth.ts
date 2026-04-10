"use client";

import { signIn, signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import type { User } from "@/server/db/schema";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  initialUser?: User | null;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, initialUser } = options ?? {};
  const router = useRouter();
  const utils  = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    initialData:          initialUser ?? undefined,
    retry:                false,
    refetchOnWindowFocus: false,
  });

  const user            = meQuery.data ?? null;
  const isAuthenticated = !!user;
  const loading         = meQuery.isLoading && !initialUser;

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }); // ✅ fixed URL
    await signOut({ redirect: false });
    await utils.auth.me.invalidate();
    router.push("/toronto");
  }, [utils, router]);

  const loginWithGoogle = useCallback(() => {
    signIn("google");
  }, []);

  // moved out of render into effect
  useEffect(() => {
    if (redirectOnUnauthenticated && !loading && !isAuthenticated) {
      router.push("/toronto");
    }
  }, [redirectOnUnauthenticated, loading, isAuthenticated, router]);

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    loginWithGoogle,
    error: meQuery.error ?? null,
  };
}