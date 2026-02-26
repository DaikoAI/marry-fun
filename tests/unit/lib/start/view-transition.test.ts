import { describe, expect, it, vi } from "vitest";

import { runWithViewTransition } from "@/lib/start/view-transition";

describe("runWithViewTransition", () => {
  it("startViewTransition が未対応なら通常実行する", () => {
    const callback = vi.fn();
    runWithViewTransition({} as Document, callback);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("startViewTransition がある場合は document コンテキストで呼び出す", () => {
    const callback = vi.fn();
    const transitionDocument: { marker: string; startViewTransition?: (applyUpdate: () => void) => void } = {
      marker: "doc",
    };

    const startViewTransition = vi.fn(function (this: unknown, applyUpdate: () => void) {
      expect(this).toBe(transitionDocument);
      applyUpdate();
    });
    transitionDocument.startViewTransition = startViewTransition;

    runWithViewTransition(transitionDocument as unknown as Document, callback);

    expect(startViewTransition).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });
});
