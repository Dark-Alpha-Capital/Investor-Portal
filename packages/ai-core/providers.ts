import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";

export const deepSeek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
