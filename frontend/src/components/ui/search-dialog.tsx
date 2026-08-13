"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import {
  Search,
  X,
  Loader2,
  Users,
  Shield,
  Blocks,
  KeyRound,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/types/auth";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "user" | "role" | "module" | "permission" | "audit-log";
  url: string;
  badge?: string;
}

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ isOpen, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFetch<{ results: SearchResult[]; query: string }>(
          `/api/v1/search?q=${encodeURIComponent(searchQuery)}`
        );
        setResults(response.results || []);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        window.location.href = results[selectedIndex].url;
        onOpenChange(false);
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const groupedResults = results.reduce(
    (acc, result) => {
      const type = result.type.charAt(0).toUpperCase() + result.type.slice(1);
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    if (!isOpen) {
      document.addEventListener("keydown", handleGlobalKeyDown);
      return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [onOpenChange, isOpen]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto py-[10vh] px-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="mx-auto w-full max-w-3xl rounded-lg border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search users, roles, modules, permissions..."
            className="flex-1 border-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
            aria-label="Search"
          />
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
          {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && query.length > 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-5 animate-spin" aria-hidden="true" />
              <p>Searching...</p>
            </div>
          )}

          {!isLoading && !query && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="mx-auto mb-2 size-5" aria-hidden="true" />
              <p>Start typing to search</p>
              <p className="text-xs">
                Press <kbd className="rounded border px-1.5 py-0.5 text-xs">Esc</kbd> to close
              </p>
            </div>
          )}

          {!isLoading && query && results.length === 0 && !error && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          )}

          {!isLoading && query && error && (
            <div className="p-4 text-center text-destructive">
              <p>
                {error.code === "AUTH_FORBIDDEN"
                  ? "You don&apos;t have permission to search"
                  : error.message || "Search failed. Please try again."}
              </p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="p-2">
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <div key={type} className="mb-3">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {type} ({typeResults.length})
                  </div>
                  <div className="space-y-0.5">
                    {typeResults.map((result) => {
                      const globalIndex = results.indexOf(result);
                      const isSelected = selectedIndex === globalIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            window.location.href = result.url;
                            onOpenChange(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                            isSelected
                              ? "bg-muted"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            {result.type === "user" && <Users className="size-4" />}
                            {result.type === "role" && <Shield className="size-4" />}
                            {result.type === "module" && <Blocks className="size-4" />}
                            {result.type === "permission" && <KeyRound className="size-4" />}
                            {result.type === "audit-log" && <Activity className="size-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{result.title}</span>
                              {result.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {result.badge}
                                </Badge>
                              )}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-muted-foreground truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          <ChevronRight
                            className={cn(
                              "size-4 shrink-0 text-muted-foreground/60",
                              isSelected && "text-foreground"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="rounded border px-1.5 py-0.5 text-xs">↑</kbd>
                <kbd className="rounded border px-1.5 py-0.5 text-xs">↓</kbd>
                to navigate
              </div>
              <div className="flex items-center gap-1">
                <kbd className="rounded border px-1.5 py-0.5 text-xs">Enter</kbd>
                to open
              </div>
            </div>
            <kbd className="rounded border px-1.5 py-0.5 text-xs">Esc</kbd>
            to close
          </div>
        </div>
      </div>
    </div>
  );
}