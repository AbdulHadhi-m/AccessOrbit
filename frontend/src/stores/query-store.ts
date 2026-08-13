"use client";

import { useCallback, useEffect, useRef } from "react";
import { create } from "zustand";

export type QueryStatus = "loading" | "success" | "error";

export interface QuerySnapshot<T> {
  data: T | null;
  error: Error | null;
  status: QueryStatus;
  refetch: () => void;
}

export interface QueryEntry<T = unknown> {
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
  register: <T>(key: string, fetcher: () => Promise<T>) => void;
  run: <T>(key: string, customFetcher?: () => Promise<T>) => Promise<void>;
  invalidate: (...keys: string[]) => void;
}

type QueryStore = QueryStoreState & QueryStoreActions;

export const useQueryStore = create<QueryStore>((set, get) => ({
  entries: {},

  register: <T>(key: string, fetcher: () => Promise<T>) => {
    const { entries } = get();
    if (entries[key]) {
      entries[key].fetcher = fetcher as () => Promise<unknown>;
      return;
    }
    set((state) => ({
      entries: {
        ...state.entries,
        [key]: {
          data: null,
          error: null,
          status: "loading",
          inflight: null,
          fetcher: fetcher as () => Promise<unknown>,
        },
      },
    }));
  },

  run: async <T>(key: string, customFetcher?: () => Promise<T>): Promise<void> => {
    const entry = get().entries[key] as QueryEntry<T> | undefined;
    const fetcher = customFetcher ?? entry?.fetcher;
    if (!fetcher) return;

    if (entry?.inflight) {
      await entry.inflight;
      return;
    }

    const inflight = (async () => {
      try {
        const data = await fetcher();
        set((state) => ({
          entries: {
            ...state.entries,
            [key]: {
              ...(state.entries[key] ?? {}),
              data,
              error: null,
              status: "success" as const,
              inflight: null,
              fetcher: fetcher as () => Promise<unknown>,
            },
          },
        }));
      } catch (error) {
        set((state) => ({
          entries: {
            ...state.entries,
            [key]: {
              ...(state.entries[key] ?? {}),
              error: error instanceof Error ? error : new Error("Request failed"),
              status: "error" as const,
              inflight: null,
              fetcher: fetcher as () => Promise<unknown>,
            },
          },
        }));
      }
    })();

    set((state) => ({
      entries: {
        ...state.entries,
        [key]: {
          ...(state.entries[key] ?? {
            data: null,
            error: null,
            status: "loading",
            fetcher: fetcher as () => Promise<unknown>,
          }),
          inflight,
        },
      },
    }));

    await inflight;
  },

  invalidate: (...keys: string[]) => {
    const toRun: string[] = [];

    set((state) => {
      const updated = { ...state.entries };
      for (const entryKey of Object.keys(updated)) {
        if (keys.some((prefix) => entryKey === prefix || entryKey.startsWith(`${prefix}:`))) {
          updated[entryKey] = { ...updated[entryKey], status: "loading" };
          toRun.push(entryKey);
        }
      }
      return { entries: updated };
    });

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
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const entry = useQueryStore(
    useCallback((s) => s.entries[key], [key])
  );

  useEffect(() => {
    const store = useQueryStore.getState();
    store.register(key, () => fetcherRef.current());

    const currentEntry = store.entries[key];
    if (!currentEntry || (currentEntry.status === "loading" && !currentEntry.inflight)) {
      void store.run(key, () => fetcherRef.current());
    }
  }, [key]);

  const refetch = useCallback(() => {
    const store = useQueryStore.getState();
    const current = store.entries[key];
    if (current) {
      useQueryStore.setState((s) => ({
        entries: { ...s.entries, [key]: { ...current, status: "loading" } },
      }));
    }
    void store.run(key, () => fetcherRef.current());
  }, [key]);

  const data = (entry?.data as T | null) ?? null;
  const error = entry?.error ?? null;
  const status = entry?.status ?? "loading";

  return { data, error, status, refetch };
}
