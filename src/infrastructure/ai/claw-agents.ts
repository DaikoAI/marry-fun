import { Output, stepCountIs, ToolLoopAgent } from "ai";
import { z } from "zod";
import { CHAT_SYSTEM_PROMPT, NGWORD_SYSTEM_PROMPT } from "@/constants/prompts/agent-prompts.generated";
import { EMOTIONS } from "@/domain/values/emotion";
import { chatModel } from "./model";

const chatResponseSchema = z.object({
  message: z.string().min(1),
  score: z.number().int().min(1).max(10),
  emotion: z.enum(EMOTIONS as unknown as [string, ...string[]]),
});

const ngWordsResponseSchema = z.object({
  words: z.array(z.string().min(1)).min(25).max(35),
});

export const clawChatAgent = new ToolLoopAgent({
  model: chatModel,
  instructions: CHAT_SYSTEM_PROMPT,
  output: Output.object({
    schema: chatResponseSchema,
    name: "marry_fun_chat_response",
  }),
  stopWhen: stepCountIs(1),
});

export const clawNgWordAgent = new ToolLoopAgent({
  model: chatModel,
  instructions: NGWORD_SYSTEM_PROMPT,
  output: Output.object({
    schema: ngWordsResponseSchema,
    name: "marry_fun_ngwords_response",
  }),
  stopWhen: stepCountIs(1),
});

export const clawShockAgent = new ToolLoopAgent({
  model: chatModel,
  instructions: CHAT_SYSTEM_PROMPT,
  stopWhen: stepCountIs(1),
});
