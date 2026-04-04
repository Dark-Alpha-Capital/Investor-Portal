import { lazy, type ComponentType } from "react";

export default function dynamic<P extends object = object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
) {
  return lazy(loader);
}
