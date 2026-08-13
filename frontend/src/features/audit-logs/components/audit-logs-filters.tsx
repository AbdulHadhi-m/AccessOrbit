"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/data-table/search-input";
import { SelectFilter } from "@/components/data-table/select-filter";

interface AuditLogsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "auth", label: "Auth" },
  { value: "users", label: "Users" },
  { value: "roles", label: "Roles" },
  { value: "modules", label: "Modules" },
  { value: "sub-modules", label: "Sub-Modules" },
  { value: "operations", label: "Operations" },
  { value: "permissions", label: "Permissions" },
  { value: "role-permissions", label: "Role Permissions" },
];

const STATUS_OPTIONS = [
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
];

export function AuditLogsFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  onReset,
}: AuditLogsFiltersProps) {
  const hasFilters = Boolean(search || category || status);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search actor, action, target..."
      />
      <div className="flex flex-wrap items-center gap-2">
        <SelectFilter
          value={category}
          onValueChange={(val) => onCategoryChange(val === "__all__" ? "" : val)}
          options={CATEGORY_OPTIONS}
          placeholder="Category"
          ariaLabel="Filter by category"
        />
        <SelectFilter
          value={status}
          onValueChange={(val) => onStatusChange(val === "__all__" ? "" : val)}
          options={STATUS_OPTIONS}
          placeholder="Status"
          ariaLabel="Filter by status"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
