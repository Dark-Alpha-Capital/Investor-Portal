import { lazy, type ComponentType } from "react";

type DynamicOptions = {
  ssr?: boolean;
};

type DynamicModule<T extends ComponentType<unknown>> =
  | T
  | { default: T };

export default function dynamic<T extends ComponentType<unknown>>(
  loader: () => Promise<DynamicModule<T>>,
  _options?: DynamicOptions,
) {
  return lazy(async () => {
    const result = await loader();
    if (typeof result === "function") {
      return { default: result };
    }
    return result;
  });
}
