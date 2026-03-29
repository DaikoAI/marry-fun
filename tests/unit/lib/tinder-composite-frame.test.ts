import { describe, expect, it } from "vitest";

import { resolveTinderFrameStyles } from "@/lib/profile-image/tinder-composite";

describe("resolveTinderFrameStyles", () => {
  it("フレーム幅に応じて内側コンテナをinsetし、枠線を可視化する", () => {
    const styles = resolveTinderFrameStyles({
      borderColor: "#FF4D6D",
      borderWidth: 14,
      borderRadius: 36,
    });

    expect(styles.outer.borderColor).toBe("#FF4D6D");
    expect(styles.outer.borderWidth).toBe(14);
    expect(styles.outer.borderRadius).toBe(36);
    expect(styles.inner.inset).toBe(14);
    expect(styles.inner.borderRadius).toBe(22);
  });
});
