"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { create } from "zustand";

export type QueryStatus = "loading" | "success" | "error";

export interface QuerySnapshot<T> {
  data: T | null;
  error: Error | null;
  status: QueryStatus;
  refetch: () => void;
}

interface QueryEntry<T = unknown> {
  data: T | null;
  error: Error | null;
  status: QueryStatus;
  inflight: Promise<void> | null;
  fetcher: () => Promise<T>;
}

interface QueryStoreState {
  entries: Record<string, QueryEntry>;
}

interface QueryStoreActions {
  getOrCreate: <T>(key: string, fetcher: () => Promise<T>) => QueryEntry<T>;
  run: <T>(key: string) => Promise<void>;
  invalidate: (...keys: string[]) => void;
}

type QueryStore = QueryStoreState & QueryStoreActions;

export const useQueryStore = create<QueryStore>((set, get) => ({
  entries: {},

  getOrCreate: <T>(key: string, fetcher: () => Promise<T>): QueryEntry<T> => {
    const { entries } = get();
    if (entries[key]) {
      return entries[key] as QueryEntry<T>;
    }
    const entry: QueryEntry<T> = {
      data: null,
      error: null,
      status: "loading",
      inflight: null,
      fetcher,
    };
    set({ entries: { ...get().entries, [key]: entry as QueryEntry } });
    return entry;
  },

  run: async <T>(key: string): Promise<void> => {
    const { entries } = get();
    const entry = entries[key] as QueryEntry<T> | undefined;
    if (!entry) return;
    if (entry.inflight) {
      await entry.inflight;
      return;
    }
    const inflight = (async () => {
      try {
        const data = await entry.fetcher();
        const current = get().entries;
        set({
          entries: {
            ...current,
            [key]: { ...current[key], data, error: null, status: "success" as const, inflight: null },
          },
        });
      } catch (error) {
        const current = get().entries;
        set({
          entries: {
            ...current,
            [key]: {
              ...current[key],
              error: error instanceof Error ? error : new Error("Request failed"),
              status: "error" as const,
              inflight: null,
            },
          },
        });
      }
    })();
    // Set inflight on the entry
    const current = get().entries;
    set({
      entries: { ...current, [key]: { ...current[key], inflight } },
    });
    await inflight;
  },

  invalidate: (...keys: string[]) => {
    const { entries } = get();
    const updated = { ...entries };
    const toRun: string[] = [];
    for (const entryKey of Object.keys(updated)) {
      if (keys.some((prefix) => entryKey === prefix || entryKey.startsWith(`${prefix}:`))) {
        updated[entryKey] = { ...updated[entryKey], status: "loading" };
        toRun.push(entryKey);
      }
    }
    set({ entries: updated });
    for (const k of toRun) {
      void get().run(k);
    }
  },
}));

export function queryKey(resource: string, params?: object): string {
  if (!params) return resource;
  const keys = Object.keys(params).filter(
    (key) => params[key as keyof typeof params] !== undefined
  );
  return keys.length === 0 ? resource : `${resource}:${JSON.stringify(params)}`;
}

export function invalidate(...keys: string[]): void {
  useQueryStore.getState().invalidate(...keys);
}

export function useQuery<T>(key: string, fetcher: () => Promise<T>): QuerySnapshot<T> {
  const store = useQueryStore();
  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    status: QueryStatus;
  }>(() => {
    const entry = store.getOrCreate(key, fetcher);
    return { data: entry.data, error: entry.error, status: entry.status };
  });
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    // Initialize entry
    const entry = useQueryStore.getState().getOrCreate(key, fetcher);

    // Sync state from store on subscription
    const unsub = useQueryStore.subscribe((s) => {
      const e = s.entries[key];
      if (e) {
        setState({ data: e.data as T | null, error: e.error, status: e.status });
      }
    });

    // Trigger fetch if still loading
    if (entry.status === "loading") {
      void useQueryStore.getState().run(key);
    }

    return unsub;
  }, [key, fetcher]);

  const refetch = useCallback(() => {
    const current = useQueryStore.getState().entries[keyRef.current];
    if (!current) return;
    const entries = useQueryStore.getState().entries;
    useQueryStore.setState({
      entries: { ...entries, [keyRef.current]: { ...current, status: "loading" } },
    });
    void useQueryStore.getState().run(keyRef.current);
  }, []);

  return { data: state.data, error: state.error, status: state.status, refetch };
}
