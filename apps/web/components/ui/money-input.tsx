import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn, formatIntegerInput } from "@/lib/utils";

type MoneyInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "onChange"
> & {
  value?: string | null;
  onChange?: (value: string) => void;
  onBlur?: ComponentProps<typeof Input>["onBlur"];
  name?: string;
  ref?: ComponentProps<typeof Input>["ref"];
};

/** Dollar amount input with live US grouping (e.g. 1000000 → 1,000,000). */
export function MoneyInput({
  value,
  onChange,
  className,
  placeholder = "1,000,000",
  ...props
}: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        $
      </span>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        className={cn("pl-7", className)}
        value={formatIntegerInput(value)}
        onChange={(e) => onChange?.(formatIntegerInput(e.target.value))}
        {...props}
      />
    </div>
  );
}
