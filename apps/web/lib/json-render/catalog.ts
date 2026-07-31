import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { z } from "zod";

export const chatCatalog = defineCatalog(schema, {
  components: {
    ...shadcnComponentDefinitions,
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string().nullable(),
      }),
      description:
        "Single metric display with label, value, and optional detail. Nest inside Card or Stack children.",
      example: {
        label: "Temperature",
        value: "72°F",
        detail: "Partly cloudy",
      },
    },
    Weather: {
      props: z.object({
        location: z.string(),
        weather: z.string(),
        temperature: z.number(),
      }),
      description:
        "Weather card for a location (temperature in Fahrenheit). Prefer nesting inside Card or Stack.",
      example: {
        location: "San Francisco",
        weather: "Sunny",
        temperature: 72,
      },
    },
  },
  actions: {},
});

export const chatCatalogPrompt = chatCatalog.prompt({
  mode: "inline",
  customRules: [
    "Use JSONL UI specs only when there is no dedicated tool UI for the result (e.g. metric cards, explainers, dashboards).",
    "Never invent investor portfolio balances, deal terms, or compliance decisions.",
    "Do not emit Weather (or weather Metric) JSONL after displayWeather — the client renders that tool result itself. Text summary only is fine.",
    "Always nest child components via the parent's children array. Example for three metrics: root Card children -> [stack-1]; stack-1 children -> [metric-a, metric-b, metric-c].",
    "Never leave a Card with an empty children array when you intend to show metrics or other content inside it.",
    "Prefer Stack direction=horizontal for side-by-side Metrics inside a Card.",
    "Do not use viewport height classes; UI sits inside the chat pane.",
  ],
});
