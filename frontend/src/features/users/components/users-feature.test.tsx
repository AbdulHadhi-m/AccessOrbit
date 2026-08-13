import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { QuerySnapshot } from "@/lib/query/query-client";
import { useQuery } from "@/lib/query/query-client";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { usersService } from "../service";
import { UsersFeature } from "./users-feature";
import { makeUser } from "@/test-utils";

vi.mock("@/lib/query/query-client", () => ({
  useQuery: vi.fn(),
  invalidate: vi.fn(),
  queryKey: (resource: string) => resource,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/hooks/use-session", () => ({ useSession: vi.fn() }));
vi.mock("@/hooks/use-debounced-value", () => ({
  useDebouncedValue: (value: string) => value,
}));
vi.mock("../service", () => ({
  usersService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const useQueryMock = vi.mocked(useQuery);
const canMock = vi.fn(() => true);
const queryMap = new Map<string, Partial<QuerySnapshot<unknown>>>();

function setQuery(key: string, snapshot: Partial<QuerySnapshot<unknown>>) {
  queryMap.set(key, snapshot);
}

function setUpSession() {
  canMock.mockReturnValue(true);
  vi.mocked(useSession).mockReturnValue({
    user: null,
    status: "authenticated",
    login: vi.fn(),
    logout: vi.fn(),
    can: canMock,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  queryMap.clear();
  useQueryMock.mockImplementation((queryKey: string) =>
    queryMap.has(queryKey)
      ? {
          data: null,
          error: null,
          status: "loading",
          refetch: vi.fn(),
          ...queryMap.get(queryKey),
        }
      : { data: null, error: null, status: "loading", refetch: vi.fn() }
  );
  setUpSession();
});

describe("UsersFeature", () => {
  it("renders the user list with roles and status", () => {
    setQuery("users", {
      data: {
        items: [
          makeUser({ id: "u1", name: "John Doe", email: "john@example.com" }),
          makeUser({
            id: "u2",
            name: "Jane Smith",
            email: "jane@example.com",
            status: "suspended",
            roles: [{ id: "r2", name: "Auditor", slug: "auditor", active: true }],
          }),
        ],
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
      status: "success",
      error: null,
    });
    setQuery("roles:options", { data: [], status: "success", error: null });

    render(<UsersFeature />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getAllByText("Administrator").length).toBeGreaterThan(0);
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("creates a user with the selected roles", async () => {
    const user = userEvent.setup();
    setQuery("users", { data: null, status: "loading", error: null });
    setQuery("roles:options", {
      data: [{ id: "r1", name: "Operator", slug: "operator", active: true }],
      status: "success",
      error: null,
    });
    vi.mocked(usersService.create).mockResolvedValue(makeUser());

    render(<UsersFeature />);

    await user.click(screen.getByRole("button", { name: "Create user" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "Alice Cooper");
    await user.type(within(dialog).getByLabelText("Email"), "alice@example.com");
    await user.type(within(dialog).getByLabelText("Password"), "SuperSecret123!");
    await user.click(within(dialog).getByRole("checkbox", { name: /Operator/ }));

    await user.click(within(dialog).getByRole("button", { name: "Create user" }));

    await waitFor(() => {
      expect(usersService.create).toHaveBeenCalledWith({
        name: "Alice Cooper",
        email: "alice@example.com",
        password: "SuperSecret123!",
        roleIds: ["r1"],
      });
    });
    expect(toast.success).toHaveBeenCalledWith("User created");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("validates the create form before submitting", async () => {
    const user = userEvent.setup();
    setQuery("users", { data: null, status: "loading", error: null });
    setQuery("roles:options", { data: [], status: "success", error: null });

    render(<UsersFeature />);

    await user.click(screen.getByRole("button", { name: "Create user" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Password"), "short");
    await user.click(within(dialog).getByRole("button", { name: "Create user" }));

    expect(within(dialog).getByText("Name is required.")).toBeInTheDocument();
    expect(within(dialog).getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(within(dialog).getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it("edits an existing user and sends only changed fields", async () => {
    const user = userEvent.setup();
    setQuery("users", {
      data: {
        items: [makeUser({ id: "u1", name: "John Doe", email: "john@example.com" })],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
      status: "success",
      error: null,
    });
    setQuery("roles:options", { data: [], status: "success", error: null });
    vi.mocked(usersService.update).mockResolvedValue(makeUser({ name: "Johnathan Doe" }));

    render(<UsersFeature />);

    await user.click(screen.getByRole("button", { name: "Edit John Doe" }));
    const dialog = screen.getByRole("dialog");
    const nameInput = within(dialog).getByLabelText("Name");
    expect(nameInput).toHaveValue("John Doe");
    expect(within(dialog).queryByLabelText("Password")).not.toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, "Johnathan Doe");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(usersService.update).toHaveBeenCalledWith("u1", { name: "Johnathan Doe" });
    });
    expect(toast.success).toHaveBeenCalledWith("User updated");
  });

  it("suspends and activates a user from the row action", async () => {
    const user = userEvent.setup();
    setQuery("users", {
      data: {
        items: [makeUser({ id: "u1", name: "John Doe", status: "active" })],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
      status: "success",
      error: null,
    });
    setQuery("roles:options", { data: [], status: "success", error: null });
    vi.mocked(usersService.update).mockResolvedValue(makeUser({ status: "suspended" }));

    render(<UsersFeature />);

    await user.click(screen.getByRole("button", { name: "Suspend John Doe" }));

    await waitFor(() => {
      expect(usersService.update).toHaveBeenCalledWith("u1", { status: "suspended" });
    });
    expect(toast.success).toHaveBeenCalledWith("User suspended");
  });

  it("surfaces a permission error from the status toggle", async () => {
    const user = userEvent.setup();
    setQuery("users", {
      data: {
        items: [makeUser({ id: "u1", name: "John Doe" })],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
      status: "success",
      error: null,
    });
    setQuery("roles:options", { data: [], status: "success", error: null });
    vi.mocked(usersService.update).mockRejectedValue(
      new Error("You do not have permission to perform this action.")
    );

    render(<UsersFeature />);

    await user.click(screen.getByRole("button", { name: "Suspend John Doe" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("permission"));
    });
  });

  it("hides create and edit actions without the required permissions", () => {
    canMock.mockReturnValue(false);
    setQuery("users", {
      data: {
        items: [makeUser({ id: "u1", name: "John Doe" })],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
      status: "success",
      error: null,
    });
    setQuery("roles:options", { data: [], status: "success", error: null });

    render(<UsersFeature />);

    expect(screen.queryByRole("button", { name: "Create user" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit John Doe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend John Doe" })).not.toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});