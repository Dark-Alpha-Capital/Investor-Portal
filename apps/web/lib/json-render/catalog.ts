import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const chatCatalog = defineCatalog(schema, {
  components: {
    Stack: {
      props: z.object({
        direction: z.enum(["vertical", "horizontal"]).nullable(),
        gap: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      slots: ["default"],
      description: "Stack layout for grouping children vertically or horizontally",
      example: { direction: "vertical", gap: "md" },
    },
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
      }),
      slots: ["default"],
      description: "Card container with a title and optional description",
      example: {
        title: "Overview",
        description: "Key metrics at a glance",
      },
    },
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(["h2", "h3", "h4"]).nullable(),
      }),
      description: "Section heading",
      example: { text: "Summary", level: "h3" },
    },
    Text: {
      props: z.object({
        content: z.string(),
        muted: z.boolean().nullable(),
      }),
      description: "Paragraph text content",
      example: { content: "Here is a short summary.", muted: false },
    },
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string().nullable(),
      }),
      description: "Single metric with label, value, and optional detail",
      example: {
        label: "Temperature",
        value: "72°F",
        detail: "Partly cloudy",
      },
    },
    Badge: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["default", "secondary", "outline"]).nullable(),
      }),
      description: "Small status or category badge",
      example: { label: "Live", variant: "secondary" },
    },
    Alert: {
      props: z.object({
        title: z.string().nullable(),
        message: z.string(),
        tone: z.enum(["default", "destructive"]).nullable(),
      }),
      description: "Inline alert or callout for important information",
      example: {
        title: "Note",
        message: "This is sample demonstration data.",
        tone: "default",
      },
    },
    Weather: {
      props: z.object({
        location: z.string(),
        weather: z.string(),
        temperature: z.number(),
      }),
      description: "Weather card for a location (temperature in Fahrenheit)",
      example: {
        location: "San Francisco",
        weather: "Sunny",
        temperature: 72,
      },
    },
  },
  actions: {},
});
