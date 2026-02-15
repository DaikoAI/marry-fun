import type { CharacterType } from "../values/character-type";
import { MAX_CHATS_PER_SESSION } from "../values/game-constants";
import type { NgWord } from "../values/ng-word";

export type GameSessionStatus = "active" | "completed" | "game_over";

export class GameSession {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly username: string,
    readonly characterType: CharacterType,
    public ngWords: NgWord[] = [],
    public status: GameSessionStatus = "active",
    public messageCount: number = 0,
    readonly createdAt: Date = new Date(),
  ) {}

  get remainingChats(): number {
    return MAX_CHATS_PER_SESSION - this.messageCount;
  }

  get canChat(): boolean {
    return this.status === "active" && this.remainingChats > 0;
  }

  checkNgWord(message: string): NgWord | null {
    return this.ngWords.find(w => w.isContainedIn(message)) ?? null;
  }

  incrementMessageCount(): void {
    this.messageCount++;
    if (this.remainingChats <= 0) {
      this.status = "completed";
    }
  }

  markGameOver(): void {
    this.status = "game_over";
  }
}
