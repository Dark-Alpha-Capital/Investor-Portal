import { useEffect, useState, type ReactNode } from "react";
import { FilterX, SlidersHorizontal } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DealFilterOptions,
  DealsIndexSearch,
} from "@/lib/loaders/deals";
import { parseFormattedInteger } from "@/lib/utils";

type DealsIndexFiltersProps = {
  search: DealsIndexSearch;
  filterOptions?: DealFilterOptions;
  onChange: (patch: Record<string, unknown>) => void;
  onClear: () => void;
};

function DebouncedFilterInput({
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  inputMode,
}: {
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  inputMode?: "text" | "numeric" | "decimal";
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const debounced = useDebouncedCallback((next: string) => {
    onChange(next);
  }, 300);

  return (
    <Input
      type={type}
      inputMode={inputMode}
      value={draft}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        setDraft(e.target.value);
        debounced(e.target.value);
      }}
    />
  );
}

function DebouncedMoneyInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const debounced = useDebouncedCallback((next: string) => {
    onChange(next);
  }, 300);

  return (
    <MoneyInput
      value={draft}
      placeholder={placeholder}
      className={className}
      onChange={(next) => {
        setDraft(next);
        debounced(next);
      }}
    />
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function SelectFilter({
  value,
  onValueChange,
  placeholder,
  options,
  allLabel,
}: {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: string[];
  allLabel: string;
}) {
  return (
    <Select
      value={value ?? "all"}
      onValueChange={(v) => onValueChange(v === "all" ? "" : v)}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DealsIndexFilters({
  search,
  filterOptions,
  onChange,
  onClear,
}: DealsIndexFiltersProps) {
  const [open, setOpen] = useState(false);

  const patch =
    (key: string) =>
    (value: string) =>
      onChange({ [key]: value.trim() ? value : undefined });

  const patchNumber =
    (key: string) =>
    (value: string) =>
      onChange({
        [key]:
          value.trim() === ""
            ? undefined
            : parseFormattedInteger(value),
      });

  const patchDecimal =
    (key: string) =>
    (value: string) => {
      const trimmed = value.trim();
      const parsed = trimmed === "" ? undefined : Number(trimmed);
      onChange({
        [key]: parsed === undefined || Number.isNaN(parsed) ? undefined : parsed,
      });
    };

  const activeCount = [
    search.sector,
    search.geography,
    search.dealType,
    search.createdAtFrom,
    search.createdAtTo,
    search.launchDateFrom,
    search.launchDateTo,
    search.closeDateFrom,
    search.closeDateTo,
    search.targetRaiseMin,
    search.targetRaiseMax,
    search.minInvestmentMin,
    search.minInvestmentMax,
    search.targetIrrMin,
    search.targetIrrMax,
    search.targetMoicMin,
    search.targetMoicMax,
  ].filter((v) => v !== undefined && v !== null && v !== "").length;

  const sectors = filterOptions?.sectors ?? [];
  const geographies = filterOptions?.geographies ?? [];
  const dealTypes = filterOptions?.dealTypes ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={activeCount > 0 ? "secondary" : "outline"}
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filters
        {activeCount > 0 ? (
          <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="grid w-full gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <FilterGroup label="Sector">
            <SelectFilter
              value={search.sector}
              onValueChange={(v) => onChange({ sector: v || undefined })}
              placeholder="Sector"
              options={sectors}
              allLabel="All Sectors"
            />
          </FilterGroup>

          <FilterGroup label="Geography">
            <SelectFilter
              value={search.geography}
              onValueChange={(v) => onChange({ geography: v || undefined })}
              placeholder="Geography"
              options={geographies}
              allLabel="All Geographies"
            />
          </FilterGroup>

          <FilterGroup label="Deal Type">
            <SelectFilter
              value={search.dealType}
              onValueChange={(v) => onChange({ dealType: v || undefined })}
              placeholder="Deal Type"
              options={dealTypes}
              allLabel="All Types"
            />
          </FilterGroup>

          <FilterGroup label="Created">
            <DebouncedFilterInput
              type="date"
              value={search.createdAtFrom}
              onChange={patch("createdAtFrom")}
              className="w-36"
              aria-label="Created from"
            />
            <DebouncedFilterInput
              type="date"
              value={search.createdAtTo}
              onChange={patch("createdAtTo")}
              className="w-36"
              aria-label="Created to"
            />
          </FilterGroup>

          <FilterGroup label="Launch Date">
            <DebouncedFilterInput
              type="date"
              value={search.launchDateFrom}
              onChange={patch("launchDateFrom")}
              className="w-36"
              aria-label="Launch date from"
            />
            <DebouncedFilterInput
              type="date"
              value={search.launchDateTo}
              onChange={patch("launchDateTo")}
              className="w-36"
              aria-label="Launch date to"
            />
          </FilterGroup>

          <FilterGroup label="Close Date">
            <DebouncedFilterInput
              type="date"
              value={search.closeDateFrom}
              onChange={patch("closeDateFrom")}
              className="w-36"
              aria-label="Close date from"
            />
            <DebouncedFilterInput
              type="date"
              value={search.closeDateTo}
              onChange={patch("closeDateTo")}
              className="w-36"
              aria-label="Close date to"
            />
          </FilterGroup>

          <FilterGroup label="Target Raise">
            <DebouncedMoneyInput
              value={search.targetRaiseMin?.toString()}
              onChange={patchNumber("targetRaiseMin")}
              placeholder="Min"
              className="w-32"
            />
            <DebouncedMoneyInput
              value={search.targetRaiseMax?.toString()}
              onChange={patchNumber("targetRaiseMax")}
              placeholder="Max"
              className="w-32"
            />
          </FilterGroup>

          <FilterGroup label="Min Investment">
            <DebouncedMoneyInput
              value={search.minInvestmentMin?.toString()}
              onChange={patchNumber("minInvestmentMin")}
              placeholder="Min"
              className="w-32"
            />
            <DebouncedMoneyInput
              value={search.minInvestmentMax?.toString()}
              onChange={patchNumber("minInvestmentMax")}
              placeholder="Max"
              className="w-32"
            />
          </FilterGroup>

          <FilterGroup label="Target IRR (%)">
            <DebouncedFilterInput
              inputMode="decimal"
              value={search.targetIrrMin?.toString()}
              onChange={patchDecimal("targetIrrMin")}
              placeholder="Min"
              className="w-32"
            />
            <DebouncedFilterInput
              inputMode="decimal"
              value={search.targetIrrMax?.toString()}
              onChange={patchDecimal("targetIrrMax")}
              placeholder="Max"
              className="w-32"
            />
          </FilterGroup>

          <FilterGroup label="Target MOIC (x)">
            <DebouncedFilterInput
              inputMode="decimal"
              value={search.targetMoicMin?.toString()}
              onChange={patchDecimal("targetMoicMin")}
              placeholder="Min"
              className="w-32"
            />
            <DebouncedFilterInput
              inputMode="decimal"
              value={search.targetMoicMax?.toString()}
              onChange={patchDecimal("targetMoicMax")}
              placeholder="Max"
              className="w-32"
            />
          </FilterGroup>
        </div>
      ) : null}

      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <FilterX className="mr-1.5 h-4 w-4" />
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
