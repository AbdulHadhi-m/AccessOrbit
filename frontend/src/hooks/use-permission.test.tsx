import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSession } from "@/hooks/use-session";
import { usePermission } from "./use-permission";

vi.mock("@/hooks/use-session", () => ({ useSession: vi.fn() }));

const canMock = vi.fn<(permission: string) => boolean>(() => false);

function setUpSession(permissions: string[], status: "loading" | "authenticated" = "authenticated") {
  canMock.mockImplementation((permission: string) => permissions.includes(permission));
  vi.mocked(useSession).mockReturnValue({
    user:
      status === "authenticated"
        ? {
            id: "u1",
            name: "Admin",
            email: "admin@example.com",
            status: "active" as const,
            roles: [{ id: "r1", name: "Administrator", slug: "administrator" }],
            permissions,
          }
        : null,
    status,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    can: canMock,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setUpSession([]);
});

describe("usePermission", () => {
  it("hasPermission returns true only for granted permissions", () => {
    setUpSession(["user.view", "user.create"]);
    const { result } = renderHook(() => usePermission());
    expect(result.current.hasPermission("user.view")).toBe(true);
    expect(result.current.hasPermission("user.create")).toBe(true);
    expect(result.current.hasPermission("user.update")).toBe(false);
    expect(result.current.hasPermission("user.delete")).toBe(false);
  });

  it("hasAnyPermission returns true when at least one permission is granted", () => {
    setUpSession(["user.view"]);
    const { result } = renderHook(() => usePermission());
    expect(result.current.hasAnyPermission(["user.update", "user.view"])).toBe(true);
    expect(result.current.hasAnyPermission(["user.delete", "user.create"])).toBe(false);
    expect(result.current.hasAnyPermission([])).toBe(false);
  });

  it("hasAllPermissions returns true only when every permission is granted", () => {
    setUpSession(["user.view", "user.update"]);
    const { result } = renderHook(() => usePermission());
    expect(result.current.hasAllPermissions(["user.view", "user.update"])).toBe(true);
    expect(result.current.hasAllPermissions(["user.view", "user.delete"])).toBe(false);
  });

  it("evaluates dynamically created permission strings", () => {
    setUpSession(["inventory.view", "inventory.adjust"]);
    const { result } = renderHook(() => usePermission());
    expect(result.current.hasPermission("inventory.view")).toBe(true);
    expect(result.current.hasPermission("inventory.approve")).toBe(false);
    expect(result.current.hasAnyPermission(["inventory.adjust", "inventory.approve"])).toBe(true);
    expect(result.current.hasAllPermissions(["inventory.view", "inventory.adjust"])).toBe(true);
  });

  it("denies everything while the session is still loading", () => {
    setUpSession([], "loading");
    const { result } = renderHook(() => usePermission());
    expect(result.current.hasPermission("user.view")).toBe(false);
    expect(result.current.hasAnyPermission(["user.view", "user.create"])).toBe(false);
    expect(result.current.hasAllPermissions(["user.view"])).toBe(false);
  });
});