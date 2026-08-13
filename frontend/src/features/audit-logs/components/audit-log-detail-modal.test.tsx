import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuditLogDetailModal } from "./audit-log-detail-modal";
import { makeAuditLog } from "@/test-utils";

describe("AuditLogDetailModal", () => {
  it("renders log details when open is true", () => {
    const log = makeAuditLog({
      action: "auth.login.success",
      category: "auth",
      requestId: "req-modal-123",
      ipAddress: "192.168.1.1",
    });

    render(<AuditLogDetailModal open={true} onOpenChange={vi.fn()} log={log} />);

    expect(screen.getByText("auth.login.success")).toBeInTheDocument();
    expect(screen.getByText("Actor Details")).toBeInTheDocument();
    expect(screen.getByText("req-modal-123")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
  });

  it("returns null when log is null", () => {
    const { container } = render(
      <AuditLogDetailModal open={true} onOpenChange={vi.fn()} log={null} />
    );

    expect(container.firstChild).toBeNull();
  });
});
