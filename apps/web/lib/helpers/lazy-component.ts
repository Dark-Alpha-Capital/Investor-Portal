import { lazy, type ComponentType } from "react";

type DynamicOptions = {
  ssr?: boolean;
};

type DynamicModule<T extends ComponentType<unknown>> =
  | T
  | { default: T };

function normalizeModule<T extends ComponentType<unknown>>(
  result: DynamicModule<T>,
): { default: T } {
  if (typeof result === "function") {
    return { default: result };
  }
  return result;
}

/**
 * Next-style `dynamic()`. When `ssr: false`, the loader is omitted from the
 * SSR/Worker graph via `import.meta.env.SSR` dead-code elimination.
 */
export default function dynamic<T extends ComponentType<unknown>>(
  loader: () => Promise<DynamicModule<T>>,
  options?: DynamicOptions,
) {
  if (options?.ssr === false) {
    if (import.meta.env.SSR) {
      return function SsrDisabledPlaceholder() {
        return null;
      } as unknown as ReturnType<typeof lazy<T>>;
    }
    return lazy(async () => normalizeModule(await loader()));
  }

  return lazy(async () => normalizeModule(await loader()));
}
