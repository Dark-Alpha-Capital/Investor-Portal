import { createElement, type ReactNode } from "react";

/** SSR stub — TipTap editor is client-only. */
export function useEditor() {
  return null;
}

export function EditorContent({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
  editor?: unknown;
}) {
  return createElement("div", { className }, children);
}
