import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSession } from "@/hooks/use-session";
import { PermissionGate, Can } from "./permission-gate";
import { DashboardShell } from "./layout/dashboard-shell";
import { PERMISSIONS } from "@/config/permissions";

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

function setUpSession(status: "loading" | "authenticated" | "unauthenticated" = "authenticated") {
  canMock.mockReturnValue(true);
  vi.mocked(useSession).mockReturnValue({
    user:
      status === "authenticated"
        ? {
            id: "u1",
            name: "Admin",
            email: "admin@example.com",
            status: "active" as const,
            roles: [{ id: "r1", name: "Administrator", slug: "administrator" }],
            permissions: [PERMISSIONS.users.view, PERMISSIONS.roles.view],
          }
        : null,
    status,
    login: vi.fn(),
    logout: vi.fn(),
    can: canMock,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setUpSession();
});

describe("PermissionGate", () => {
  it("renders children when the user has the permission", () => {
    render(
      <PermissionGate permission={PERMISSIONS.users.view}>
        <p>Secret content</p>
      </PermissionGate>
    );
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("renders the access denied screen when the user lacks the permission", () => {
    canMock.mockReturnValue(false);
    render(
      <PermissionGate permission={PERMISSIONS.users.view}>
        <p>Secret content</p>
      </PermissionGate>
    );
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    expect(screen.getByText("Access denied")).toBeInTheDocument();
  });

  it("renders nothing while the session is still loading", () => {
    setUpSession("loading");
    render(
      <PermissionGate permission={PERMISSIONS.users.view}>
        <p>Secret content</p>
      </PermissionGate>
    );
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    expect(screen.queryByText("Access denied")).not.toBeInTheDocument();
  });

  it("renders nothing inside Can when the permission is missing", () => {
    canMock.mockReturnValue(false);
    render(
      <Can permission={PERMISSIONS.users.create}>
        <button type="button">Create user</button>
      </Can>
    );
    expect(screen.queryByRole("button", { name: "Create user" })).not.toBeInTheDocument();
  });
});

describe("DashboardShell navigation", () => {
  it("shows all navigation items when every permission is granted", () => {
    render(
      <DashboardShell>
        <p>Page content</p>
      </DashboardShell>
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Roles" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Modules" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Permissions" })).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("hides navigation items the user cannot access", () => {
    canMock.mockImplementation((permission: string) => permission !== PERMISSIONS.roles.view);
    render(
      <DashboardShell>
        <p>Page content</p>
      </DashboardShell>
    );
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Roles" })).not.toBeInTheDocument();
  });

  it("shows the logged-in user's name and roles", () => {
    render(
      <DashboardShell>
        <p>Page content</p>
      </DashboardShell>
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
  });
});