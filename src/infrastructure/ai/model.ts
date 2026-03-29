import { openai } from "@ai-sdk/openai";

export const CHAT_MODEL_ID = "gpt-4.1-mini";

export const chatModel = openai(CHAT_MODEL_ID);
