"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthInitializer() {
  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  return null;
}
