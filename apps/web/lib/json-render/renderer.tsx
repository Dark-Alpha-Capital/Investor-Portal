"use client";

import {
  ActionProvider,
  Renderer,
  StateProvider,
  VisibilityProvider,
  type Spec,
} from "@json-render/react";
import { registry } from "./registry";

type ChatJsonRendererProps = {
  spec: Spec | null;
  loading?: boolean;
};

export function ChatJsonRenderer({ spec, loading }: ChatJsonRendererProps) {
  if (!spec) {
    return null;
  }

  return (
    <div className="mt-3 w-full max-w-2xl">
      <StateProvider initialState={{}}>
        <VisibilityProvider>
          <ActionProvider handlers={{}}>
            <Renderer loading={loading} registry={registry} spec={spec} />
          </ActionProvider>
        </VisibilityProvider>
      </StateProvider>
    </div>
  );
}
