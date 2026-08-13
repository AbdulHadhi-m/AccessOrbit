import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery } from "@/stores/query-store";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { permissionsService } from "../service";
import { PermissionsFeature } from "./permissions-feature";
import { makeModule, makeSubModule, makeOperation, makePermission } from "@/test-utils";

vi.mock("@/stores/query-store", () => ({
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
  permissionsService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
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

describe("PermissionsFeature", () => {
  it("renders permissions with the resolved module, sub-module and operation path", () => {
    setQuery("permissions", {
      items: [makePermission({ id: "p1", key: "employees.view", active: true })],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    setQuery("modules:options", [makeModule()]);
    setQuery("sub-modules:options", [makeSubModule()]);
    setQuery("operations:options", [makeOperation()]);

    render(<PermissionsFeature />);

    expect(screen.getByText("employees.view")).toBeInTheDocument();
    expect(screen.getByText("View Purchase Orders")).toBeInTheDocument();
    expect(screen.getByText("Procurement")).toBeInTheDocument();
    expect(screen.getByText("Purchase Orders")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("creates a permission through the cascading module, sub-module and operation selects", async () => {
    const user = userEvent.setup();
    setQuery("permissions", { items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
    setQuery("modules:options", [makeModule()]);
    setQuery("sub-modules:options", [makeSubModule()]);
    setQuery("operations:options", [makeOperation()]);
    vi.mocked(permissionsService.create).mockResolvedValue(makePermission());

    render(<PermissionsFeature />);

    await user.click(screen.getByRole("button", { name: "Create permission" }));
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("combobox", { name: "Select a module" }));
    await user.click(await screen.findByRole("option", { name: "Procurement" }));

    await user.click(within(dialog).getByRole("combobox", { name: "Select a sub-module or none" }));
    await user.click(await screen.findByRole("option", { name: "Purchase Orders" }));

    await user.click(within(dialog).getByRole("combobox", { name: "Select an operation" }));
    await user.click(await screen.findByRole("option", { name: "View (view)" }));

    await user.type(within(dialog).getByLabelText("Key"), "employees.view");
    await user.type(within(dialog).getByLabelText("Name"), "View Purchase Orders");
    await user.click(within(dialog).getByRole("button", { name: "Create permission" }));

    await waitFor(() => {
      expect(permissionsService.create).toHaveBeenCalledWith({
        key: "employees.view",
        name: "View Purchase Orders",
        description: undefined,
        moduleId: "m1",
        operationId: "o1",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Permission created");
  });

  it("rejects invalid dotted keys before submitting", async () => {
    const user = userEvent.setup();
    setQuery("permissions", { items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
    setQuery("modules:options", [makeModule()]);
    setQuery("sub-modules:options", [makeSubModule()]);
    setQuery("operations:options", [makeOperation()]);

    render(<PermissionsFeature />);

    await user.click(screen.getByRole("button", { name: "Create permission" }));
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("combobox", { name: "Select a module" }));
    await user.click(await screen.findByRole("option", { name: "Procurement" }));
    await user.click(within(dialog).getByRole("combobox", { name: "Select a sub-module or none" }));
    await user.click(await screen.findByRole("option", { name: "Purchase Orders" }));
    await user.click(within(dialog).getByRole("combobox", { name: "Select an operation" }));
    await user.click(await screen.findByRole("option", { name: "View (view)" }));

    await user.type(within(dialog).getByLabelText("Key"), "invalid key!");
    await user.type(within(dialog).getByLabelText("Name"), "Something");
    await user.click(within(dialog).getByRole("button", { name: "Create permission" }));

    expect(
      within(dialog).getByText(/Use dotted keys like operation\.verb/)
    ).toBeInTheDocument();
    expect(permissionsService.create).not.toHaveBeenCalled();
  });

  it("requires a module and operation selection", async () => {
    const user = userEvent.setup();
    setQuery("permissions", { items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
    setQuery("modules:options", [makeModule()]);
    setQuery("sub-modules:options", [makeSubModule()]);
    setQuery("operations:options", [makeOperation()]);

    render(<PermissionsFeature />);

    await user.click(screen.getByRole("button", { name: "Create permission" }));
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Key"), "employees.view");
    await user.type(within(dialog).getByLabelText("Name"), "View Purchase Orders");
    await user.click(within(dialog).getByRole("button", { name: "Create permission" }));

    expect(within(dialog).getByText("Select a module.")).toBeInTheDocument();
    expect(permissionsService.create).not.toHaveBeenCalled();
  });

  it("edits a permission without allowing key or operation changes", async () => {
    const user = userEvent.setup();
    setQuery("permissions", {
      items: [makePermission({ id: "p1", key: "employees.view", active: true })],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    setQuery("modules:options", [makeModule()]);
    setQuery("sub-modules:options", [makeSubModule()]);
    setQuery("operations:options", [makeOperation()]);
    vi.mocked(permissionsService.update).mockResolvedValue(
      makePermission({ name: "View All Purchase Orders" })
    );

    render(<PermissionsFeature />);

    await user.click(screen.getByRole("button", { name: "Edit employees.view" }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByLabelText("Key")).toHaveValue("employees.view");
    expect(within(dialog).queryByRole("combobox", { name: /Select a module/ })).not.toBeInTheDocument();

    const nameInput = within(dialog).getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "View All Purchase Orders");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(permissionsService.update).toHaveBeenCalledWith("p1", {
        name: "View All Purchase Orders",
        description: "View purchase order records",
        active: true,
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Permission updated");
  });

  it("deactivates a permission", async () => {
    const user = userEvent.setup();
    setQuery("permissions", {
      items: [makePermission({ id: "p1", key: "employees.view", active: true })],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    setQuery("modules:options", [makeModule()]);
    setQuery("sub-modules:options", [makeSubModule()]);
    setQuery("operations:options", [makeOperation()]);
    vi.mocked(permissionsService.update).mockResolvedValue(makePermission({ active: false }));

    render(<PermissionsFeature />);

    await user.click(screen.getByRole("button", { name: "Deactivate employees.view" }));

    await waitFor(() => {
      expect(permissionsService.update).toHaveBeenCalledWith("p1", { active: false });
    });
    expect(toast.success).toHaveBeenCalledWith("Permission deactivated");
  });

  it("hides create and edit actions without the required permissions", () => {
    canMock.mockReturnValue(false);
    setQuery("permissions", {
      items: [makePermission({ id: "p1", key: "employees.view" })],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    setQuery("modules:options", [makeModule()]);
    setQuery("sub-modules:options", [makeSubModule()]);
    setQuery("operations:options", [makeOperation()]);

    render(<PermissionsFeature />);

    expect(screen.queryByRole("button", { name: "Create permission" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit employees.view" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("employees.view")).toBeInTheDocument();
  });
});