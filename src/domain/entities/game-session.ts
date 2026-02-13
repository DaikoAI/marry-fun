import type { CharacterType } from "../values/character-type";
import type { NgWord } from "../values/ng-word";

export type GameSessionStatus = "active" | "game_over";

export class GameSession {
  status: GameSessionStatus = "active";
  messageCount = 0;

  constructor(
    readonly id: string,
    readonly username: string,
    readonly characterType: CharacterType,
    public ngWords: NgWord[] = [],
  ) {}

  checkNgWord(message: string): NgWord | null {
    return this.ngWords.find(w => w.isContainedIn(message)) ?? null;
  }

  incrementMessageCount(): void {
    this.messageCount++;
  }
}
