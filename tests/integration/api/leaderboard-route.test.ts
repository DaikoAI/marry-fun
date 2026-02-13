import { beforeEach, describe, expect, it, vi } from "vitest";

interface LeaderboardApiResponse {
  message?: string;
  generatedAt?: string;
  dailyWindow?: {
    start: string;
    end: string;
    timezone: string;
  };
  total?: Array<{ rank: number; userId: string; displayName: string; points: number }>;
  daily?: Array<{ rank: number; userId: string; displayName: string; points: number }>;
}

async function jsonBody(res: Response): Promise<LeaderboardApiResponse> {
  return (await res.json()) as LeaderboardApiResponse;
}

const mockGetLeaderboard = vi.fn(async () => {
  const leaderboard = await Promise.resolve({
    generatedAt: new Date("2026-02-13T08:00:00.000Z"),
    dailyWindow: {
      start: new Date("2026-02-13T00:00:00.000Z"),
      end: new Date("2026-02-14T00:00:00.000Z"),
      timezone: "UTC" as const,
    },
    total: [{ rank: 1, userId: "u1", displayName: "Alice", points: 1200 }],
    daily: [{ rank: 1, userId: "u2", displayName: "Bob", points: 80 }],
  });
  return leaderboard;
});

vi.mock("@/infrastructure/points-container", () => ({
  pointService: {
    getLeaderboard: mockGetLeaderboard,
  },
}));

const { GET } = await import("@/app/api/leaderboard/route");

describe("GET /api/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("認証なしで leaderboard を返す", async () => {
    const res = await GET();
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(mockGetLeaderboard).toHaveBeenCalledWith(20);
    expect(json.dailyWindow?.timezone).toBe("UTC");
    expect(json.total?.[0]?.rank).toBe(1);
    expect(json.daily?.[0]?.points).toBe(80);
  });

  it("内部エラー時に 500 を返す", async () => {
    mockGetLeaderboard.mockRejectedValueOnce(new Error("db failed"));

    const res = await GET();
    const json = await jsonBody(res);

    expect(res.status).toBe(500);
    expect(json.message).toBe("db failed");
  });
});
