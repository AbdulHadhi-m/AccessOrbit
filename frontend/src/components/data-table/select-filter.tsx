"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SelectFilterOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectFilterOption[];
  placeholder?: string;
  allLabel?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function SelectFilter({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  allLabel = "All",
  ariaLabel,
  disabled,
}: SelectFilterProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
      disabled={disabled}
    >
      <SelectTrigger aria-label={ariaLabel ?? placeholder} className="w-full sm:w-44">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}