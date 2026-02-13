export interface PointTransactionRecord {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  idempotencyKey: string | null;
  createdAt: Date;
}

export interface PointSnapshot {
  userId: string;
  balance: number;
  transactions: PointTransactionRecord[];
}

export interface AddPointsInput {
  userId: string;
  amount: number;
  reason: string;
  idempotencyKey?: string;
}

export interface LeaderboardRecord {
  userId: string;
  displayName: string;
  points: number;
}

export interface LeaderboardQuery {
  limit: number;
  dailyStart: Date;
  dailyEnd: Date;
}

export interface LeaderboardRows {
  total: LeaderboardRecord[];
  daily: LeaderboardRecord[];
}

export interface PointRepository {
  getSnapshot: (userId: string, limit?: number) => Promise<PointSnapshot>;
  addPoints: (input: AddPointsInput) => Promise<PointSnapshot>;
  getLeaderboard: (query: LeaderboardQuery) => Promise<LeaderboardRows>;
}
