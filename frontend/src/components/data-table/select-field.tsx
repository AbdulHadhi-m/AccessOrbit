import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled,
  id,
}: SelectFieldProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted-foreground">No options available</p>
        )}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}