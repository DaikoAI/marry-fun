const BASE_MULTIPLIER = 1.2;
const TOKEN_BONUS_MULTIPLIER = 1.5;

export class Score {
  readonly adjusted: number;

  private constructor(readonly raw: number) {
    const baseAdjusted = Math.round(raw * BASE_MULTIPLIER);
    this.adjusted = Math.round(baseAdjusted * TOKEN_BONUS_MULTIPLIER);
  }

  static fromRaw(raw: number): Score {
    if (!Number.isInteger(raw)) {
      throw new RangeError(`Score must be an integer, got ${String(raw)}`);
    }
    if (raw < 1 || raw > 10) {
      throw new RangeError(`Score must be between 1 and 10, got ${String(raw)}`);
    }
    return new Score(raw);
  }
}
