import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { useSession } from "@/hooks/use-session";
import { PermissionGuard } from "./permission-guard";
import { DashboardShell } from "./layout/dashboard-shell";
import { PERMISSIONS } from "@/config/permissions";
import type { User } from "@/types/auth";

vi.mock("@/hooks/use-session", () => ({ useSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/users",
  useRouter: () => ({ replace: vi.fn() }),
}));
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

const canMock = vi.fn<(permission: string) => boolean>(() => true);

function setUpSession(
  status: "loading" | "authenticated" | "unauthenticated" = "authenticated",
  permissions: string[] = [PERMISSIONS.users.view, PERMISSIONS.roles.view]
) {
  canMock.mockImplementation((permission: string) => permissions.includes(permission));
  const user: User | null =
    status === "authenticated"
      ? {
          id: "u1",
          name: "Admin",
          email: "admin@example.com",
          status: "active",
          roles: [{ id: "r1", name: "Administrator", slug: "administrator" }],
          permissions,
        }
      : null;
  vi.mocked(useSession).mockReturnValue({
    user,
    status,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    can: canMock,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setUpSession();
});

describe("PermissionGuard", () => {
  it("renders children when the single permission is granted", () => {
    render(
      <PermissionGuard permission={PERMISSIONS.users.view}>
        <p>Secret content</p>
      </PermissionGuard>
    );
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("renders the access denied page when the permission is missing", () => {
    setUpSession("authenticated", []);
    render(
      <PermissionGuard permission={PERMISSIONS.users.view}>
        <p>Secret content</p>
      </PermissionGuard>
    );
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    expect(screen.getByText("Access restricted")).toBeInTheDocument();
  });

  it("supports anyOf and denies when none match", () => {
    setUpSession("authenticated", [PERMISSIONS.users.create]);
    const { rerender } = render(
      <PermissionGuard anyOf={[PERMISSIONS.users.create, PERMISSIONS.users.update]}>
        <p>Any content</p>
      </PermissionGuard>
    );
    expect(screen.getByText("Any content")).toBeInTheDocument();

    setUpSession("authenticated", [PERMISSIONS.users.delete]);
    rerender(
      <PermissionGuard anyOf={[PERMISSIONS.users.create, PERMISSIONS.users.update]}>
        <p>Any content</p>
      </PermissionGuard>
    );
    expect(screen.queryByText("Any content")).not.toBeInTheDocument();
  });

  it("supports allOf and denies when any is missing", () => {
    setUpSession("authenticated", [PERMISSIONS.users.view, PERMISSIONS.users.update]);
    const { rerender } = render(
      <PermissionGuard allOf={[PERMISSIONS.users.view, PERMISSIONS.users.update]}>
        <p>All content</p>
      </PermissionGuard>
    );
    expect(screen.getByText("All content")).toBeInTheDocument();

    setUpSession("authenticated", [PERMISSIONS.users.view]);
    rerender(
      <PermissionGuard allOf={[PERMISSIONS.users.view, PERMISSIONS.users.update]}>
        <p>All content</p>
      </PermissionGuard>
    );
    expect(screen.queryByText("All content")).not.toBeInTheDocument();
    expect(screen.getByText("Access restricted")).toBeInTheDocument();
  });

  it("renders nothing instead of the access denied page when fallback is null", () => {
    setUpSession("authenticated", []);
    render(
      <PermissionGuard permission={PERMISSIONS.users.delete} fallback={null}>
        <button type="button">Delete user</button>
      </PermissionGuard>
    );
    expect(screen.queryByRole("button", { name: "Delete user" })).not.toBeInTheDocument();
    expect(screen.queryByText("Access restricted")).not.toBeInTheDocument();
  });

  it("renders a custom fallback", () => {
    setUpSession("authenticated", []);
    render(
      <PermissionGuard permission={PERMISSIONS.users.delete} fallback={<p>Locked</p>}>
        <button type="button">Delete user</button>
      </PermissionGuard>
    );
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  it("renders nothing while the session is loading (no flicker)", () => {
    setUpSession("loading");
    render(
      <PermissionGuard permission={PERMISSIONS.users.view}>
        <p>Secret content</p>
      </PermissionGuard>
    );
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    expect(screen.queryByText("Access restricted")).not.toBeInTheDocument();
  });

  it("evaluates dynamically created permission strings", () => {
    setUpSession("authenticated", ["inventory.view"]);
    render(
      <PermissionGuard permission="inventory.view">
        <p>Inventory content</p>
      </PermissionGuard>
    );
    expect(screen.getByText("Inventory content")).toBeInTheDocument();
  });
});

describe("Scenario: page-level authorization", () => {
  it("direct /modules access without module.view shows access denied", () => {
    setUpSession("authenticated", []);
    render(
      <PermissionGuard permission={PERMISSIONS.modules.view}>
        <p>Modules content</p>
      </PermissionGuard>
    );
    expect(screen.queryByText("Modules content")).not.toBeInTheDocument();
    expect(screen.getByText("Access restricted")).toBeInTheDocument();
  });
});

describe("DashboardShell navigation", () => {
  it("shows every navigation item when all permissions are granted", () => {
    setUpSession("authenticated", [
      PERMISSIONS.users.view,
      PERMISSIONS.roles.view,
      PERMISSIONS.modules.view,
      PERMISSIONS.permissions.view,
    ]);
    render(
      <DashboardShell>
        <p>Page content</p>
      </DashboardShell>
    );
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Roles" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Modules" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Permissions" })).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("hides navigation items the user cannot access", () => {
    setUpSession("authenticated", [PERMISSIONS.users.view]);
    render(
      <DashboardShell>
        <p>Page content</p>
      </DashboardShell>
    );
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Roles" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Modules" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Permissions" })).not.toBeInTheDocument();
  });

  it("shows only the Dashboard link for a user with no rbac permissions", () => {
    setUpSession("authenticated", []);
    render(
      <DashboardShell>
        <p>Page content</p>
      </DashboardShell>
    );
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Roles" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Modules" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Permissions" })).not.toBeInTheDocument();
  });

  it("shows a skeleton shell during loading instead of navigation (no flicker)", () => {
    setUpSession("loading");
    render(
      <DashboardShell>
        <p>Page content</p>
      </DashboardShell>
    );
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByText("Page content")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).not.toBeNull();
  });
});