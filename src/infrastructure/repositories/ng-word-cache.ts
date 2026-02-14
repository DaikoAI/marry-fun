import type { NgWord } from "@/domain/values/ng-word";

const STORE_KEY = Symbol.for("marry-fun-dev.ng-word-cache");

function getStore(): Map<string, NgWord[]> {
  const g = globalThis as Record<symbol, Map<string, NgWord[]> | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = new Map();
  }
  return g[STORE_KEY];
}

export class NgWordCache {
  set(sessionId: string, ngWords: NgWord[]): void {
    getStore().set(sessionId, ngWords);
  }

  get(sessionId: string): NgWord[] | undefined {
    return getStore().get(sessionId);
  }

  delete(sessionId: string): void {
    getStore().delete(sessionId);
  }
}
