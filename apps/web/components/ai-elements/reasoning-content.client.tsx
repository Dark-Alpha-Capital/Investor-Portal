"use client";

import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { memo } from "react";
import { Streamdown } from "streamdown";

const streamdownPlugins = { cjk, code, math, mermaid };

export const ReasoningMarkdown = memo(
  ({ className, children }: { className?: string; children: string }) => (
    <Streamdown className={cn(className)} plugins={streamdownPlugins}>
      {children}
    </Streamdown>
  )
);

ReasoningMarkdown.displayName = "ReasoningMarkdown";
