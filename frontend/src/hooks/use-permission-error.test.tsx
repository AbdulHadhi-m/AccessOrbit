import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSession } from "@/hooks/use-session";
import { usePermissionError } from "./use-permission";
import { ApiError, type User } from "@/types/auth";

vi.mock("@/hooks/use-session", () => ({ useSession: vi.fn() }));

const refreshMock = vi.fn<() => Promise<User>>(() =>
  Promise.resolve({
    id: "u1",
    email: "admin@example.com",
    name: "Admin",
    roles: [{ id: "r1", name: "Administrator", slug: "administrator" }],
    status: "active",
    permissions: [],
  })
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useSession).mockReturnValue({
    user: null,
    status: "authenticated",
    login: vi.fn(),
    logout: vi.fn(),
    refresh: refreshMock,
    can: vi.fn(() => true),
  });
});

describe("usePermissionError", () => {
  it("maps a backend 403 to a friendly message and refreshes the session", () => {
    const { result } = renderHook(() => usePermissionError("Unable to delete the user."));
    const message = result.current(
      new ApiError(403, "AUTH_FORBIDDEN", "You are not authorized to perform this action.")
    );
    expect(message).toBe(
      "You do not have permission to perform this action. If you believe this is a mistake, contact an administrator."
    );
    expect(message).not.toContain("AUTH_FORBIDDEN");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does not expose backend internals for forbidden errors", () => {
    const { result } = renderHook(() => usePermissionError());
    const message = result.current(
      new ApiError(403, "AUTH_FORBIDDEN", "rbac.users.delete is required", undefined, "req-123")
    );
    expect(message).not.toContain("rbac.users.delete");
    expect(message).not.toContain("req-123");
  });

  it("keeps the original error message for non-forbidden errors", () => {
    const { result } = renderHook(() => usePermissionError("Unable to delete the user."));
    const message = result.current(new Error("network exploded"));
    expect(message).toBe("network exploded");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("uses the fallback for non-forbidden unknown errors", () => {
    const { result } = renderHook(() => usePermissionError("Unable to delete the user."));
    const message = result.current("something unknown");
    expect(message).toBe("Unable to delete the user.");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("surfaces validation details for 422 errors", () => {
    const { result } = renderHook(() => usePermissionError("Unable to create the user."));
    const message = result.current(
      new ApiError(422, "VALIDATION_ERROR", "Validation failed", [
        { field: "email", message: "Email is invalid." },
      ])
    );
    expect(message).toBe("Email is invalid.");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("never lets the raw backend message leak", () => {
    const { result } = renderHook(() => usePermissionError());
    const message = result.current(
      new ApiError(500, "INTERNAL", "mongodb connection pool exhausted: 5f2a1c")
    );
    expect(message).not.toContain("mongodb");
  });
});