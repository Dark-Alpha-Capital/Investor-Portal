import { createElement, type ReactNode } from "react";

/** SSR stub — real Streamdown (shiki/mermaid/katex) is client-only. */
export function Streamdown({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
  plugins?: unknown;
  isAnimating?: boolean;
}) {
  return createElement("div", { className }, children);
}

export default Streamdown;
