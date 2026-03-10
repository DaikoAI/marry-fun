import { describe, expect, it } from "vitest";

import enGoal from "@/constants/messages/en/goal.json";
import enHelp from "@/constants/messages/en/help.json";
import jaGoal from "@/constants/messages/ja/goal.json";
import jaHelp from "@/constants/messages/ja/help.json";

describe("game copy", () => {
  it("英語のデイリートップ説明は翌日の彼氏化を明示する", () => {
    expect(enGoal.topPlayer).toBe("🏆 The Daily Top Player becomes her boyfriend for the following day!");
  });

  it("ヘルプ文言は$TOKENを使い、$MARRYを出さない", () => {
    expect(JSON.stringify(enHelp)).toContain("$TOKEN");
    expect(JSON.stringify(jaHelp)).toContain("$TOKEN");
    expect(JSON.stringify(enHelp)).not.toContain("$MARRY");
    expect(JSON.stringify(jaHelp)).not.toContain("$MARRY");
  });

  it("ゲーム目標文言に$MARRYを出さない", () => {
    expect(JSON.stringify(enGoal)).not.toContain("$MARRY");
    expect(JSON.stringify(jaGoal)).not.toContain("$MARRY");
  });
});
