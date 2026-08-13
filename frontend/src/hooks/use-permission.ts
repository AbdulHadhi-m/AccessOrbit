"use client";

import { useAuth } from "@/providers/auth-provider";

export function useCan(): (permission: string) => boolean {
  return useAuth().can;
}

export function useHasPermission(permission: string): boolean {
  return useAuth().can(permission);
}