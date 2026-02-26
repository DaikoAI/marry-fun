import { describe, expect, it } from "vitest";

import {
  buildProfileShareIntentUrl,
  createProfileShareToken,
  decodeProfileShareToken,
  pickDailyProfileDecorations,
} from "@/lib/profile-share";

describe("profile share helpers", () => {
  it("同じ userId/date なら同じ装飾が選ばれる", () => {
    const first = pickDailyProfileDecorations({
      userId: "u1",
      dateKey: "2026-02-24",
    });
    const second = pickDailyProfileDecorations({
      userId: "u1",
      dateKey: "2026-02-24",
    });

    expect(first).toEqual(second);
  });

  it("トークンは round-trip できる", () => {
    const token = createProfileShareToken(
      {
        userId: "u1",
        locale: "ja",
        imageUrl: "https://im.runware.ai/generated.webp",
        name: "alice",
        location: "Tokyo",
        tags: ["Kind", "Talkative"],
      },
      "test-secret",
    );

    const decoded = decodeProfileShareToken(token, "test-secret");
    expect(decoded).toEqual({
      userId: "u1",
      locale: "ja",
      imageUrl: "https://im.runware.ai/generated.webp",
      name: "alice",
      location: "Tokyo",
      tags: ["Kind", "Talkative"],
    });
  });

  it("改ざんトークンは null を返す", () => {
    const token = createProfileShareToken(
      {
        userId: "u1",
        locale: "ja",
        imageUrl: "https://im.runware.ai/generated.webp",
        name: "alice",
        location: "Tokyo",
        tags: ["Kind"],
      },
      "test-secret",
    );

    const tampered = `${token.slice(0, -1)}X`;
    expect(decodeProfileShareToken(tampered, "test-secret")).toBeNull();
  });

  it("X intent URL を組み立てる", () => {
    const url = buildProfileShareIntentUrl({
      text: "check my tinder vibe",
      url: "https://marry.fun/ja/profile-share/sample",
    });

    expect(url).toContain("https://twitter.com/intent/tweet?");
    expect(url).toContain("check+my+tinder+vibe");
    expect(url).toContain("https%3A%2F%2Fmarry.fun%2Fja%2Fprofile-share%2Fsample");
  });
});
