
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  paramKey?: string;
  placeholder?: string;
  className?: string;
  onResetPage?: boolean;
  debounceMs?: number;
}

export function SearchInput({
  paramKey = "search",
  placeholder = "Search...",
  className,
  onResetPage = true,
  debounceMs = 300,
}: SearchInputProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isSearching, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const query = searchParams.get(paramKey)?.toString() || "";

  const handleSearch = useDebouncedCallback((value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramKey, value);
        if (onResetPage) {
          params.delete("page");
        }
      } else {
        params.delete(paramKey);
        if (onResetPage) {
          params.delete("page");
        }
      }
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, debounceMs);

  const handleClearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      handleSearch("");
    }
  };

  return (
    <div
      className={cn("relative flex-1 max-w-sm", className)}
      data-pending={isSearching ? "" : undefined}
    >
      {isSearching ? (
        <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        ref={inputRef}
        className={cn("pl-9", query && "pr-9")}
        placeholder={placeholder}
        defaultValue={query}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            inputRef.current?.blur();
          }
        }}
      />
      {query && (
        <Button
          className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          onClick={handleClearInput}
          variant="ghost"
          size="icon"
          type="button"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
