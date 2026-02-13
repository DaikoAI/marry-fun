import type {
  AddPointsInput,
  LeaderboardRecord,
  PointRepository,
  PointSnapshot,
} from "@/domain/repositories/point-repository";
import type { UserRepository, UserSummary } from "@/domain/repositories/user-repository";

export interface UserPointsView {
  userId: string;
  walletAddress: string | null;
  balance: number;
  transactions: PointSnapshot["transactions"];
}

export interface LeaderboardEntryView {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
}

export interface LeaderboardView {
  generatedAt: Date;
  dailyWindow: {
    start: Date;
    end: Date;
    timezone: "UTC";
  };
  total: LeaderboardEntryView[];
  daily: LeaderboardEntryView[];
}

const DEFAULT_LEADERBOARD_LIMIT = 20;

export class PointService {
  constructor(
    private readonly pointRepository: PointRepository,
    private readonly userRepository: UserRepository,
    private readonly nowProvider: () => Date = () => new Date(),
  ) {}

  async getMyPoints(userId: string): Promise<UserPointsView> {
    const [snapshot, user] = await Promise.all([
      this.pointRepository.getSnapshot(userId),
      this.userRepository.findById(userId),
    ]);

    return {
      userId,
      walletAddress: getPrimarySvmWalletAddress(user),
      balance: snapshot.balance,
      transactions: snapshot.transactions,
    };
  }

  async addMyPoints(input: AddPointsInput): Promise<UserPointsView> {
    const snapshot = await this.pointRepository.addPoints(input);
    const user = await this.userRepository.findById(input.userId);

    return {
      userId: input.userId,
      walletAddress: getPrimarySvmWalletAddress(user),
      balance: snapshot.balance,
      transactions: snapshot.transactions,
    };
  }

  async getLeaderboard(limit = DEFAULT_LEADERBOARD_LIMIT): Promise<LeaderboardView> {
    const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(limit, 100)) : DEFAULT_LEADERBOARD_LIMIT;
    const now = this.nowProvider();
    const dailyWindow = toUtcDayWindow(now);
    const rows = await this.pointRepository.getLeaderboard({
      limit: safeLimit,
      dailyStart: dailyWindow.start,
      dailyEnd: dailyWindow.end,
    });

    return {
      generatedAt: now,
      dailyWindow: {
        start: dailyWindow.start,
        end: dailyWindow.end,
        timezone: "UTC",
      },
      total: withRank(rows.total),
      daily: withRank(rows.daily),
    };
  }
}

function withRank(entries: LeaderboardRecord[]): LeaderboardEntryView[] {
  return entries.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}

function toUtcDayWindow(now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function getPrimarySvmWalletAddress(user: UserSummary | null): string | null {
  if (!user) {
    return null;
  }

  const primaryWallet = user.walletAddresses.find(wallet => wallet.type === "svm" && wallet.isPrimary);
  if (primaryWallet) {
    return primaryWallet.address;
  }

  const firstSvmWallet = user.walletAddresses.find(wallet => wallet.type === "svm");
  return firstSvmWallet?.address ?? null;
}
