import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Get the current weather in a location",
  inputSchema: z.object({
    location: z.string().describe("City name to get the weather for"),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
    unit: "fahrenheit" as const,
    condition: "partly cloudy",
  }),
});
