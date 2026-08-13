import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { QuerySnapshot } from "@/lib/query/query-client";
import { useQuery } from "@/lib/query/query-client";
import { usePermission } from "@/hooks/use-permission";
import { AuditLogsFeature } from "./audit-logs-feature";
import { makeAuditLog } from "@/test-utils";

vi.mock("@/lib/query/query-client", () => ({
  useQuery: vi.fn(),
  invalidate: vi.fn(),
  queryKey: (resource: string) => resource,
}));
vi.mock("@/hooks/use-permission", () => ({ usePermission: vi.fn() }));
vi.mock("@/hooks/use-debounced-value", () => ({
  useDebouncedValue: (value: string) => value,
}));
vi.mock("../service", () => ({
  auditService: { list: vi.fn() },
}));

const useQueryMock = vi.mocked(useQuery);
const usePermissionMock = vi.mocked(usePermission);
const queryMap = new Map<string, Partial<QuerySnapshot<unknown>>>();

function setQuery(key: string, snapshot: Partial<QuerySnapshot<unknown>>) {
  queryMap.set(key, snapshot);
}

beforeEach(() => {
  vi.clearAllMocks();
  queryMap.clear();
  usePermissionMock.mockReturnValue({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  });
  useQueryMock.mockImplementation((key: string) => {
    const entry = Array.from(queryMap.entries()).find(([k]) => key === k || key.startsWith(`${k}:`));
    return entry
      ? {
          data: null,
          error: null,
          status: "loading",
          refetch: vi.fn(),
          ...entry[1],
        }
      : { data: null, error: null, status: "loading", refetch: vi.fn() };
  });
});

describe("AuditLogsFeature component", () => {
  it("renders Access Denied view when user lacks audit.view permission", () => {
    usePermissionMock.mockReturnValue({
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
    });

    render(<AuditLogsFeature />);

    expect(screen.getByText("Access restricted")).toBeInTheDocument();
    expect(
      screen.getByText(/You do not have permission to access this resource/i)
    ).toBeInTheDocument();
  });

  it("renders audit logs table with formatted columns and status badges", () => {
    const log1 = makeAuditLog({
      id: "log-1",
      action: "auth.login.success",
      category: "auth",
      status: "success",
      actor: { id: "u1", email: "alice@example.com", name: "Alice" },
    });
    const log2 = makeAuditLog({
      id: "log-2",
      action: "user.delete",
      category: "users",
      status: "failure",
      actor: { id: "u2", email: "bob@example.com", name: "Bob" },
    });

    setQuery("audit-logs", {
      status: "success",
      data: {
        items: [log1, log2],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });

    render(<AuditLogsFeature />);

    expect(screen.getByText("Audit Logs")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("auth.login.success")).toBeInTheDocument();
    expect(screen.getByText("user.delete")).toBeInTheDocument();
    expect(screen.getByText("success")).toBeInTheDocument();
    expect(screen.getByText("failure")).toBeInTheDocument();
  });

  it("opens detail modal when inspect button is clicked", async () => {
    const user = userEvent.setup();
    const log = makeAuditLog({
      id: "log-inspect",
      action: "role.create",
      category: "roles",
      requestId: "req-inspect-123",
      ipAddress: "192.168.1.100",
      details: { roleName: "Manager" },
    });

    setQuery("audit-logs", {
      status: "success",
      data: {
        items: [log],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });

    render(<AuditLogsFeature />);

    const inspectBtn = screen.getByRole("button", {
      name: `Inspect audit log ${log.id}`,
    });
    await user.click(inspectBtn);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Actor Details")).toBeInTheDocument();
    expect(within(dialog).getByText("req-inspect-123")).toBeInTheDocument();
    expect(within(dialog).getByText("192.168.1.100")).toBeInTheDocument();
  });

  it("handles error state and allows retrying", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    setQuery("audit-logs", {
      status: "error",
      error: new Error("Network error fetching audit logs"),
      refetch,
    });

    render(<AuditLogsFeature />);

    expect(screen.getByText("Network error fetching audit logs")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    await user.click(retryBtn);
    expect(refetch).toHaveBeenCalled();
  });
});
