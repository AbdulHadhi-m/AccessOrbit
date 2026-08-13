import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery } from "@/lib/query/query-client";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { rolesService } from "../service";
import { RolesFeature } from "./roles-feature";
import {
  makeRole,
  makeHierarchyModule,
  makeRolePermissionItem,
  checkboxByAriaLabel,
} from "@/test-utils";

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
  rolesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    permissions: vi.fn(),
    assignPermission: vi.fn(),
    removePermission: vi.fn(),
  },
}));

const useQueryMock = vi.mocked(useQuery);
const canMock = vi.fn(() => true);
const queryMap = new Map<
  string,
  { data: unknown; error: Error | null; status: "loading" | "success" | "error"; refetch: () => void }
>();

function setQuery(key: string, data: unknown, status: "loading" | "success" | "error" = "success") {
  queryMap.set(key, { data, error: null, status, refetch: vi.fn() });
}

beforeEach(() => {
  vi.clearAllMocks();
  queryMap.clear();
  useQueryMock.mockImplementation((queryKey: string) =>
    queryMap.get(queryKey) ?? {
      data: null,
      error: null,
      status: "loading" as const,
      refetch: vi.fn(),
    }
  );
  canMock.mockReturnValue(true);
  vi.mocked(useSession).mockReturnValue({
    user: null,
    status: "authenticated",
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    can: canMock,
  });
});

describe("RolesFeature", () => {
  it("renders the role list", () => {
    setQuery("roles", {
      items: [
        makeRole({ id: "r1", name: "Administrator", permissionKeys: ["rbac.users.view"] }),
        makeRole({
          id: "r2",
          name: "Auditor",
          slug: "auditor",
          isSystem: false,
          active: false,
          permissionKeys: [],
        }),
      ],
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });

    render(<RolesFeature />);

    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("Auditor")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /Administrator/ })).getByText("1")).toBeInTheDocument();
  });

  it("creates a role", async () => {
    const user = userEvent.setup();
    setQuery("roles", { items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
    vi.mocked(rolesService.create).mockResolvedValue(makeRole({ name: "Operator" }));

    render(<RolesFeature />);

    await user.click(screen.getByRole("button", { name: "Create role" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "Operator");
    await user.type(within(dialog).getByLabelText("Description"), "Day-to-day operations");
    await user.click(within(dialog).getByRole("button", { name: "Create role" }));

    await waitFor(() => {
      expect(rolesService.create).toHaveBeenCalledWith({
        name: "Operator",
        description: "Day-to-day operations",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Role created");
  });

  it("edits a role and sends only changed fields", async () => {
    const user = userEvent.setup();
    setQuery("roles", {
      items: [makeRole({ id: "r1", name: "Administrator", description: "Full access" })],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    vi.mocked(rolesService.update).mockResolvedValue(makeRole({ description: "Full access" }));

    render(<RolesFeature />);

    await user.click(screen.getByRole("button", { name: "Edit Administrator" }));
    const dialog = screen.getByRole("dialog");
    const nameInput = within(dialog).getByLabelText("Name");
    expect(nameInput).toHaveValue("Administrator");

    await user.clear(nameInput);
    await user.type(nameInput, "Super Administrator");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(rolesService.update).toHaveBeenCalledWith("r1", {
        name: "Super Administrator",
        description: "Full access",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Role updated");
  });

  it("toggles a role status", async () => {
    const user = userEvent.setup();
    setQuery("roles", {
      items: [makeRole({ id: "r1", name: "Operator", isSystem: false, active: true })],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    vi.mocked(rolesService.update).mockResolvedValue(makeRole({ active: false }));

    render(<RolesFeature />);

    await user.click(screen.getByRole("button", { name: "Deactivate Operator" }));

    await waitFor(() => {
      expect(rolesService.update).toHaveBeenCalledWith("r1", { active: false });
    });
    expect(toast.success).toHaveBeenCalledWith("Role deactivated");
  });

  it("assigns and removes a permission through the dynamic hierarchy dialog", async () => {
    const user = userEvent.setup();
    setQuery("roles", {
      items: [makeRole({ id: "r1", name: "Operator", isSystem: false, permissionKeys: [] })],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    setQuery("modules:hierarchy", [makeHierarchyModule()]);
    setQuery("role-permissions:r1", [
      makeRolePermissionItem({
        roleId: "r1",
        permissionKey: "employees.view",
        permission: {
          id: "p1",
          key: "employees.view",
          name: "View Purchase Orders",
          description: "",
          moduleId: "m1",
          operationId: "o1",
          active: true,
        },
      }),
    ]);
    vi.mocked(rolesService.assignPermission).mockResolvedValue([]);
    vi.mocked(rolesService.removePermission).mockResolvedValue(undefined);

    render(<RolesFeature />);

    await user.click(screen.getByRole("button", { name: "Manage permissions for Operator" }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("Procurement")).toBeInTheDocument();
    expect(within(dialog).getByText("Purchase Orders")).toBeInTheDocument();
    expect(within(dialog).getByText("employees.view")).toBeInTheDocument();
    expect(within(dialog).getByText("employees.create")).toBeInTheDocument();

    await user.click(checkboxByAriaLabel(within(dialog), "Remove employees.view"));
    await waitFor(() => {
      expect(rolesService.removePermission).toHaveBeenCalledWith("r1", "p1");
    });
    expect(toast.success).toHaveBeenCalledWith("Permission removed: employees.view");

    await user.click(checkboxByAriaLabel(within(dialog), "Assign employees.create"));
    await waitFor(() => {
      expect(rolesService.assignPermission).toHaveBeenCalledWith("r1", {
        permissionKey: "employees.create",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Permission assigned: employees.create");
  });

  it("disables assignment for an inactive role and hides the delete action for system roles", async () => {
    const user = userEvent.setup();
    setQuery("roles", {
      items: [makeRole({ id: "r1", name: "Administrator", active: false, permissionKeys: [] })],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    setQuery("modules:hierarchy", [makeHierarchyModule()]);
    setQuery("role-permissions:r1", []);

    render(<RolesFeature />);

    expect(screen.queryByRole("button", { name: "Delete Administrator" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Manage permissions for Administrator" }));
    const dialog = screen.getByRole("dialog");
    const checkbox = checkboxByAriaLabel(within(dialog), "Assign employees.view");
    expect(checkbox).toHaveAttribute("data-disabled");
    expect(within(dialog).getByText(/This role is inactive/)).toBeInTheDocument();
  });
});