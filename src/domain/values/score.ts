const BONUS_MULTIPLIER = 1.2;

export class Score {
  readonly adjusted: number;

  private constructor(readonly raw: number) {
    this.adjusted = Math.round(raw * BONUS_MULTIPLIER);
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
