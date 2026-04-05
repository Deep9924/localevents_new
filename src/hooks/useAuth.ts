// src/hooks/useAuth.ts
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {};
  const router = useRouter();
  const { data: session, status } = useSession();
  const utils = trpc.useUtils();

  const loading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // Still pull the full DB user via tRPC so the rest of the app gets
  // the same User shape it always expected (role, id, etc.)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    await utils.auth.me.invalidate();
    router.push("/toronto");
  }, [utils, router]);

  const loginWithGoogle = useCallback(() => {
    signIn("google");
  }, []);

  const user = meQuery.data ?? null;

  if (redirectOnUnauthenticated && !loading && !isAuthenticated) {
    router.push("/toronto");
  }

  return {
    user,
    loading: loading || (isAuthenticated && meQuery.isLoading),
    isAuthenticated,
    logout,
    loginWithGoogle,
    error: meQuery.error ?? null,
  };
}
