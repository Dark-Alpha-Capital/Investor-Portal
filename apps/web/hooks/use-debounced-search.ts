
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface UseDebouncedSearchOptions {
  /** The URL search param key to sync with */
  paramKey: string;
  /** Debounce delay in milliseconds (default: 300) */
  delay?: number;
}

interface UseDebouncedSearchReturn {
  /** Current input value (updates immediately on user input) */
  value: string;
  /** Handler for input onChange */
  onChange: (value: string) => void;
  /** The debounced value that's synced with URL params */
  debouncedValue: string;
  /** Clear the search input and URL param */
  clear: () => void;
}

/**
 * A hook for managing debounced search inputs that sync with URL search params.
 * Uses the `use-debounce` library for efficient debouncing.
 *
 * @example
 * ```tsx
 * const { value, onChange, debouncedValue } = useDebouncedSearch({ paramKey: "search" });
 *
 * <Input
 *   value={value}
 *   onChange={(e) => onChange(e.target.value)}
 * />
 * ```
 */
export function useDebouncedSearch({
  paramKey,
  delay = 300,
}: UseDebouncedSearchOptions): UseDebouncedSearchReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current value from URL params
  const paramValue = searchParams.get(paramKey) || "";

  // Local state for immediate input updates
  const [inputValue, setInputValue] = useState(paramValue);

  // Sync local state when URL param changes externally
  useEffect(() => {
    setInputValue(paramValue);
  }, [paramValue]);

  // Update URL params helper
  const updateUrlParam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramKey, value);
      } else {
        params.delete(paramKey);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router, paramKey]
  );

  // Debounced URL update using use-debounce library
  const debouncedUpdateUrl = useDebouncedCallback((value: string) => {
    if (value !== paramValue) {
      updateUrlParam(value);
    }
  }, delay);

  // Handler for input changes
  const handleChange = useCallback(
    (value: string) => {
      setInputValue(value);
      debouncedUpdateUrl(value);
    },
    [debouncedUpdateUrl]
  );

  // Clear handler
  const handleClear = useCallback(() => {
    setInputValue("");
    updateUrlParam("");
  }, [updateUrlParam]);

  return {
    value: inputValue,
    onChange: handleChange,
    debouncedValue: paramValue,
    clear: handleClear,
  };
}
