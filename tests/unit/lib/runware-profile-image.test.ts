import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRunwareProfilePrompt,
  normalizeRunwareReferenceImageUrl,
  RUNWARE_PROFILE_MODEL_DEFAULT,
  RUNWARE_PROFILE_PROMPT_MAX_LENGTH,
} from "@/constants/profile-image/runware";
import { generateProfileImageWithRunware, pickRunwareImageUrlFromResponse } from "@/lib/runware/profile-image";

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    RUNWARE_API_KEY: "rw_test_key",
    RUNWARE_MODEL: undefined as string | undefined,
  },
}));

vi.mock("@/env", () => ({
  env: mockEnv,
}));

describe("pickRunwareImageUrlFromResponse", () => {
  it("imageURL を優先して抽出する", () => {
    const imageUrl = pickRunwareImageUrlFromResponse({
      data: [{ taskType: "imageInference", imageURL: "https://im.runware.ai/a.webp" }],
    });

    expect(imageUrl).toBe("https://im.runware.ai/a.webp");
  });

  it("URL 形式でない場合は null", () => {
    const imageUrl = pickRunwareImageUrlFromResponse({
      data: [{ taskType: "imageInference", imageURL: "invalid-url" }],
    });

    expect(imageUrl).toBeNull();
  });
});

describe("buildRunwareProfilePrompt", () => {
  it("Runware prompt 上限長以内で rwre を含む", () => {
    const prompt = buildRunwareProfilePrompt({
      locale: "ja",
      displayName: "a".repeat(200),
      xUsername: `@${"b".repeat(200)}`,
    });

    expect(prompt.length).toBeLessThanOrEqual(RUNWARE_PROFILE_PROMPT_MAX_LENGTH);
    expect(prompt).toContain("rwre");
  });
});

describe("normalizeRunwareReferenceImageUrl", () => {
  it("pbs.twimg.com の _normal 画像URLを _400x400 に変換する", () => {
    const normalized = normalizeRunwareReferenceImageUrl(
      "https://pbs.twimg.com/profile_images/19260958/avatar_normal.jpg",
    );
    expect(normalized).toBe("https://pbs.twimg.com/profile_images/19260958/avatar_400x400.jpg");
  });

  it("pbs.twimg.com の name=normal クエリを name=400x400 に変換する", () => {
    const normalized = normalizeRunwareReferenceImageUrl(
      "https://pbs.twimg.com/profile_images/19260958/avatar?format=jpg&name=normal",
    );
    expect(normalized).toBe("https://pbs.twimg.com/profile_images/19260958/avatar?format=jpg&name=400x400");
  });
});

describe("generateProfileImageWithRunware", () => {
  const fetchMock = vi.fn();

  const parseRunwareBodyFromCall = (index: number): Array<Record<string, unknown>> => {
    const [, init] = fetchMock.mock.calls[index] as [string, RequestInit];
    if (typeof init.body !== "string") {
      throw new TypeError("Runware request body must be string");
    }
    const parsed: unknown = JSON.parse(init.body);
    if (!Array.isArray(parsed)) {
      throw new TypeError("Runware request body must be array");
    }
    return parsed as Array<Record<string, unknown>>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    mockEnv.RUNWARE_API_KEY = "rw_test_key";
    mockEnv.RUNWARE_MODEL = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Runware APIへ imageInference payload でPOSTし、生成画像URLを返す", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [{ imageURL: "https://im.runware.ai/generated.webp" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await generateProfileImageWithRunware({
      locale: "ja",
      seed: 42,
      inputFaceImageUrl: "https://pbs.twimg.com/profile_images/123/avatar_normal.jpg",
      displayName: "alice",
      xUsername: "alice_x",
    });

    expect(result).toEqual({ imageUrl: "https://im.runware.ai/generated.webp" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.runware.ai/v1");
    expect(init.method).toBe("POST");
    expect(init.cache).toBe("no-store");
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      Authorization: "Bearer rw_test_key",
    });

    const body = parseRunwareBodyFromCall(0);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      taskType: "imageInference",
      model: RUNWARE_PROFILE_MODEL_DEFAULT,
      width: 768,
      height: 960,
      numberResults: 1,
      outputFormat: "WEBP",
      steps: 28,
      CFGScale: 6.5,
      inputs: {
        referenceImages: ["https://pbs.twimg.com/profile_images/123/avatar_400x400.jpg"],
      },
      seed: 42,
    });
    expect(typeof body[0].positivePrompt).toBe("string");
    expect(String(body[0].positivePrompt).length).toBeLessThanOrEqual(RUNWARE_PROFILE_PROMPT_MAX_LENGTH);
  });

  it("Runwareの400エラー詳細を含んだ例外を投げる", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [{ error: "positivePrompt length should be <= 300" }],
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      generateProfileImageWithRunware({
        locale: "en",
        inputFaceImageUrl: "https://pbs.twimg.com/profile_images/123/avatar.jpg",
        displayName: "alice",
        xUsername: "alice_x",
      }),
    ).rejects.toThrow("Runware request failed with status 400: positivePrompt length should be <= 300");
  });

  it("RUNWARE_MODEL が失敗したらデフォルトモデルで再試行する", async () => {
    mockEnv.RUNWARE_MODEL = "runware:invalid@1";

    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ error: "model not found" }],
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ imageURL: "https://im.runware.ai/fallback.webp" }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const result = await generateProfileImageWithRunware({
      locale: "ja",
      inputFaceImageUrl: "https://pbs.twimg.com/profile_images/123/avatar.jpg",
      displayName: "alice",
      xUsername: "alice_x",
    });

    expect(result).toEqual({ imageUrl: "https://im.runware.ai/fallback.webp" });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstBody = parseRunwareBodyFromCall(0);
    const secondBody = parseRunwareBodyFromCall(1);

    expect(firstBody[0]?.model).toBe("runware:invalid@1");
    expect(secondBody[0]?.model).toBe(RUNWARE_PROFILE_MODEL_DEFAULT);
  });

  it("APIキー未設定ならRunware呼び出し前に失敗する", async () => {
    mockEnv.RUNWARE_API_KEY = "";

    await expect(
      generateProfileImageWithRunware({
        locale: "en",
        inputFaceImageUrl: "https://pbs.twimg.com/profile_images/123/avatar.jpg",
        displayName: "alice",
        xUsername: "alice_x",
      }),
    ).rejects.toThrow("RUNWARE_API_KEY is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
