import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery } from "@/stores/query-store";
import { useSession } from "@/hooks/use-session";
import { PERMISSIONS } from "@/config/permissions";
import { DashboardFeature } from "./dashboard-feature";
import { makeUser, makeRole, makePermission, makeHierarchyModule } from "@/test-utils";
import type { DashboardOverview } from "../types/dashboard";

vi.mock("@/stores/query-store", () => ({
  useQuery: vi.fn(),
  invalidate: vi.fn(),
  queryKey: (resource: string) => resource,
}));
vi.mock("@/hooks/use-session", () => ({ useSession: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const useQueryMock = vi.mocked(useQuery);
const canMock = vi.fn<(permission: string) => boolean>(() => true);
const refetchMock = vi.fn();

function makeOverview(overrides: Partial<DashboardOverview> = {}): DashboardOverview {
  return {
    users: {
      total: 1234,
      active: 1150,
      suspended: 84,
      recent: [
        makeUser({ id: "u1", name: "Alice Cooper", email: "alice@example.com" }),
        makeUser({ id: "u2", name: "Bob Marley", email: "bob@example.com", status: "suspended" }),
      ],
    },
    roles: {
      total: 18,
      recent: [makeRole({ id: "r1", name: "Operator", slug: "operator" })],
    },
    permissions: {
      total: 96,
      recent: [makePermission({ id: "p1", key: "employees.view", name: "View Employees" })],
    },
    hierarchy: {
      modules: [makeHierarchyModule()],
      counts: { modules: 1, subModules: 1, operations: 2, permissions: 3 },
    },
    ...overrides,
  };
}

function setQuery(snapshot: Partial<ReturnType<typeof useQueryMock>>) {
  useQueryMock.mockReturnValue({
    data: null,
    error: null,
    status: "loading",
    refetch: refetchMock,
    ...snapshot,
  } as ReturnType<typeof useQueryMock>);
}

function setUpSession(permissions: string[] = [
  PERMISSIONS.users.view,
  PERMISSIONS.roles.view,
  PERMISSIONS.modules.view,
  PERMISSIONS.permissions.view,
]) {
  canMock.mockImplementation((permission: string) => permissions.includes(permission));
  vi.mocked(useSession).mockReturnValue({
    user: {
      id: "u1",
      name: "Admin",
      email: "admin@example.com",
      status: "active",
      roles: [{ id: "r1", name: "Administrator", slug: "administrator" }],
      permissions,
    },
    status: "authenticated",
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    can: canMock,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  refetchMock.mockReset();
  setUpSession();
  setQuery({ data: makeOverview(), status: "success", error: null });
});

describe("DashboardFeature", () => {
  it("renders statistics from API data", () => {
    render(<DashboardFeature />);
    expect(screen.getByText("Total users")).toBeInTheDocument();
    expect(screen.getByText((1234).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText((1150).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText((84).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText("Total roles")).toBeInTheDocument();
    expect(screen.getByText((18).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText("Total modules")).toBeInTheDocument();
    expect(screen.getByText("Total permissions")).toBeInTheDocument();
    expect(screen.getByText((96).toLocaleString())).toBeInTheDocument();
  });

  it("renders the RBAC structure with counts and per-module summaries", () => {
    render(<DashboardFeature />);
    expect(screen.getByText("RBAC structure")).toBeInTheDocument();
    expect(screen.getByText("Modules")).toBeInTheDocument();
    expect(screen.getByText("Sub-modules")).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Permissions")).toBeInTheDocument();
    expect(screen.getByText("Procurement")).toBeInTheDocument();
    expect(screen.getByText("1 sub-module")).toBeInTheDocument();
    expect(screen.getByText("2 operations")).toBeInTheDocument();
    expect(screen.getByText("3 permissions")).toBeInTheDocument();
  });

  it("shows skeletons instead of numbers while loading", () => {
    setQuery({ data: null, status: "loading", error: null });
    render(<DashboardFeature />);
    expect(screen.queryByText((1234).toLocaleString())).not.toBeInTheDocument();
    expect(screen.queryByText((96).toLocaleString())).not.toBeInTheDocument();
    expect(document.querySelector("[data-slot='skeleton']")).not.toBeNull();
  });

  it("shows an error state with retry and never renders stats", async () => {
    const user = userEvent.setup();
    setQuery({ data: null, status: "error", error: new Error("boom") });
    render(<DashboardFeature />);
    expect(screen.getByText("Could not load the dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Total users")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(1));
  });

  it("hides sections the user has no permission to view", () => {
    setUpSession([PERMISSIONS.roles.view]);
    render(<DashboardFeature />);
    expect(screen.getByText("Total roles")).toBeInTheDocument();
    expect(screen.queryByText("Total users")).not.toBeInTheDocument();
    expect(screen.queryByText("Total permissions")).not.toBeInTheDocument();
    expect(screen.queryByText("Recent users")).not.toBeInTheDocument();
    expect(screen.queryByText("RBAC structure")).not.toBeInTheDocument();
  });

  it("shows an empty state when no dashboard sections are permitted", () => {
    setUpSession([]);
    render(<DashboardFeature />);
    expect(screen.getByText("No dashboard data available")).toBeInTheDocument();
    expect(screen.queryByText("Total roles")).not.toBeInTheDocument();
  });

  it("renders recent lists with real items and per-list empty states", () => {
    setQuery({
      data: makeOverview({
        users: { total: 2, active: 2, suspended: 0, recent: [] },
        roles: { total: 1, recent: [] },
        permissions: { total: 1, recent: [makePermission({ id: "p1", key: "employees.view" })] },
      }),
      status: "success",
      error: null,
    });
    render(<DashboardFeature />);
    expect(screen.getByText("No users have been created yet.")).toBeInTheDocument();
    expect(screen.getByText("No roles have been created yet.")).toBeInTheDocument();
    expect(screen.getByText("employees.view")).toBeInTheDocument();
  });

  it("marks suspended users in the recent list", () => {
    render(<DashboardFeature />);
    expect(screen.getByText("Alice Cooper")).toBeInTheDocument();
    expect(screen.getByText("Bob Marley")).toBeInTheDocument();
    expect(screen.getAllByText("Suspended").length).toBeGreaterThan(0);
  });

  it("shows an empty RBAC structure when no modules exist", () => {
    setQuery({
      data: makeOverview({
        hierarchy: { modules: [], counts: { modules: 0, subModules: 0, operations: 0, permissions: 0 } },
      }),
      status: "success",
      error: null,
    });
    render(<DashboardFeature />);
    expect(screen.getByText("No modules have been created yet.")).toBeInTheDocument();
  });
});