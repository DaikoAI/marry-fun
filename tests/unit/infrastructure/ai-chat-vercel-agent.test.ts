import { describe, expect, it, vi } from "vitest";
import { AiChatVercelAgent } from "@/infrastructure/adapter/ai-chat-vercel-agent";
import type { AiChatVercelAgentDependencies } from "@/infrastructure/adapter/ai-chat-vercel-agent";

describe("AiChatVercelAgent", () => {
  it("sendMessage で structured output をそのまま返す", async () => {
    const chatAgent: AiChatVercelAgentDependencies["chatAgent"] = {
      generate: async () => {
        const result = await Promise.resolve({
          output: {
            message: "こんにちは、テストさん！",
            score: 7,
            emotion: "joy",
          },
        });
        return result;
      },
    };
    const chatSpy = vi.spyOn(chatAgent, "generate");
    const adapter = new AiChatVercelAgent({
      chatAgent,
      ngWordAgent: { generate: vi.fn() },
      shockAgent: { generate: vi.fn() },
    });

    const result = await adapter.sendMessage("session-1", "tsundere", "テスト", "今日は楽しかったよ", "ja");

    expect(result).toEqual({
      message: "こんにちは、テストさん！",
      score: 7,
      emotion: "joy",
    });
    expect(chatSpy).toHaveBeenCalledTimes(1);
    expect(chatSpy.mock.calls[0]?.[0].prompt).toContain("User message: 今日は楽しかったよ");
  });

  it("generateNgWords で words 配列を返す", async () => {
    const ngWordAgent: AiChatVercelAgentDependencies["ngWordAgent"] = {
      generate: async () => {
        const result = await Promise.resolve({
          output: {
            words: ["嫌い", "雨", "猫"],
          },
        });
        return result;
      },
    };
    const ngWordSpy = vi.spyOn(ngWordAgent, "generate");
    const adapter = new AiChatVercelAgent({
      chatAgent: { generate: vi.fn() },
      ngWordAgent,
      shockAgent: { generate: vi.fn() },
    });

    const result = await adapter.generateNgWords("session-1", "cool", "ja");

    expect(result).toEqual(["嫌い", "雨", "猫"]);
    expect(ngWordSpy).toHaveBeenCalledTimes(1);
    expect(ngWordSpy.mock.calls[0]?.[0].prompt).toContain("Character type: cool");
  });

  it("getShockResponse で agent が失敗した場合は fallback を返す", async () => {
    const shockGenerate: AiChatVercelAgentDependencies["shockAgent"]["generate"] = vi.fn(async () => {
      await Promise.resolve();
      throw new Error("boom");
    });
    const shockAgent: AiChatVercelAgentDependencies["shockAgent"] = {
      generate: shockGenerate,
    };
    const adapter = new AiChatVercelAgent({
      chatAgent: { generate: vi.fn() },
      ngWordAgent: { generate: vi.fn() },
      shockAgent,
    });

    await expect(adapter.getShockResponse("session-1", "cool", "alice", "boring", "en")).resolves.toBe(
      "Why would you say that...! I can't believe it...!",
    );
  });
});
