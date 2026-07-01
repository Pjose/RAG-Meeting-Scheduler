import { useQuery, useQueryClient } from "@tanstack/react-query";

export const AUTH_QUERY_KEY = ["auth/me"] as const;

export type UserRole = "Admin" | "Coordinator" | "Member" | "Guest";

export interface AuthState {
  authenticated: boolean;
  role: UserRole | null;
}

export function useAuth() {
  return useQuery<AuthState>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      return res.json() as Promise<AuthState>;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.setQueryData<AuthState>(AUTH_QUERY_KEY, { authenticated: false, role: null });
  };
}

export function canManage(role: UserRole | null | undefined): boolean {
  return role === "Admin" || role === "Coordinator";
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === "Admin";
}
