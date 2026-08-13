"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type QueryStatus = "loading" | "success" | "error";

export interface QuerySnapshot<T> {
  data: T | null;
  error: Error | null;
  status: QueryStatus;
  refetch: () => void;
}

interface QueryEntry<T> {
  key: string;
  fetcher: () => Promise<T>;
  data: T | null;
  error: Error | null;
  status: QueryStatus;
  inflight: Promise<void> | null;
  listeners: Set<() => void>;
}

const entries = new Map<string, QueryEntry<unknown>>();

export function queryKey(resource: string, params?: object): string {
  if (!params) return resource;
  const keys = Object.keys(params).filter((key) => params[key as keyof typeof params] !== undefined);
  return keys.length === 0 ? resource : `${resource}:${JSON.stringify(params)}`;
}

function getOrCreate<T>(key: string, fetcher: () => Promise<T>): QueryEntry<T> {
  let entry = entries.get(key) as QueryEntry<T> | undefined;
  if (!entry) {
    entry = {
      key,
      fetcher,
      data: null,
      error: null,
      status: "loading",
      inflight: null,
      listeners: new Set(),
    };
    entries.set(key, entry as QueryEntry<unknown>);
  }
  return entry;
}

function notify<T>(entry: QueryEntry<T>): void {
  for (const listener of entry.listeners) {
    listener();
  }
}

async function run<T>(entry: QueryEntry<T>): Promise<void> {
  if (entry.inflight) {
    await entry.inflight;
    return;
  }
  entry.inflight = (async () => {
    try {
      const data = await entry.fetcher();
      entry.data = data;
      entry.error = null;
      entry.status = "success";
    } catch (error) {
      entry.error = error instanceof Error ? error : new Error("Request failed");
      entry.status = "error";
    } finally {
      entry.inflight = null;
      notify(entry);
    }
  })();
  await entry.inflight;
}

export function invalidate(...keys: string[]): void {
  for (const [key, entry] of entries) {
    if (keys.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))) {
      entry.status = "loading";
      notify(entry);
      void run(entry);
    }
  }
}

export function useQuery<T>(key: string, fetcher: () => Promise<T>): QuerySnapshot<T> {
  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    status: QueryStatus;
  }>(() => {
    const entry = getOrCreate(key, fetcher);
    return { data: entry.data, error: entry.error, status: entry.status };
  });
  const entryRef = useRef<QueryEntry<T> | null>(null);

  useEffect(() => {
    const entry = getOrCreate(key, fetcher);
    entryRef.current = entry;
    const listener = () => setState({ data: entry.data, error: entry.error, status: entry.status });
    entry.listeners.add(listener);
    if (entry.status === "loading") {
      void run(entry);
    }
    return () => {
      entry.listeners.delete(listener);
    };
  }, [key, fetcher]);

  const refetch = useCallback(() => {
    const entry = entryRef.current;
    if (!entry) return;
    entry.status = "loading";
    notify(entry);
    void run(entry);
  }, []);

  return { data: state.data, error: state.error, status: state.status, refetch };
}