import type { ToolSet } from "ai";
import { weatherTool } from "./weather";

export { weatherTool } from "./weather";

export const chatbotTools = {
  weather: weatherTool,
} satisfies ToolSet;
