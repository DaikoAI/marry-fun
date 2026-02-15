import type { NgWord } from "@/domain/values/ng-word";

export interface NgWordCachePort {
  set: (sessionId: string, ngWords: NgWord[]) => void;
  get: (sessionId: string) => NgWord[] | undefined;
  delete: (sessionId: string) => void;
}
