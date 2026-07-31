"use client";

import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { Weather } from "@/components/chatbot/weather";
import { chatCatalog } from "./catalog";

export const { registry } = defineRegistry(chatCatalog, {
  components: {
    ...shadcnComponents,
    Metric: ({ props }) => (
      <div className="min-w-28 flex-1 rounded-md border bg-muted/30 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">{props.label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
          {props.value}
        </p>
        {props.detail ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{props.detail}</p>
        ) : null}
      </div>
    ),
    Weather: ({ props }) => (
      <Weather
        location={props.location}
        temperature={props.temperature}
        weather={props.weather}
      />
    ),
  },
});
