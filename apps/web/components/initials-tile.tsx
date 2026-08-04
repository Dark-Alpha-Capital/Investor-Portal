import { cn } from "@/lib/utils";

const TINT_PALETTE = [
  "bg-primary/10 text-primary",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  "bg-violet-500/10 text-violet-700 dark:text-violet-400",
];

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TINT_PALETTE[hash % TINT_PALETTE.length];
}

export function InitialsTile({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold",
        tintFor(name),
        className,
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
