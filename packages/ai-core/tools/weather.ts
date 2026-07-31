import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Display the weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => {
    // Simulate a short fetch so the UI can show a loading state.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const conditions = ["Sunny", "Partly cloudy", "Cloudy", "Light rain"] as const;
    const weather =
      conditions[Math.floor(Math.random() * conditions.length)] ?? "Sunny";

    return {
      location,
      weather,
      temperature: 60 + Math.floor(Math.random() * 25),
    };
  },
});
