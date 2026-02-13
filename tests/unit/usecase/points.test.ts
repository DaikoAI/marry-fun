import { describe, expect, it, vi } from "vitest";

import type { PointRepository } from "@/domain/repositories/point-repository";
import type { UserRepository } from "@/domain/repositories/user-repository";
import { PointService } from "@/usecase/points";

describe("PointService", () => {
  it("ウォレットアドレスを含むポイントスナップショットを返す", async () => {
    const pointRepository: PointRepository = {
      getSnapshot: vi.fn().mockResolvedValue({
        userId: "u1",
        balance: 10,
        transactions: [],
      }),
      getLeaderboard: vi.fn(),
      addPoints: vi.fn(),
    };

    const userRepository: UserRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "u1",
        name: null,
        email: null,
        walletAddresses: [
          {
            type: "svm",
            address: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
            chainId: null,
            isPrimary: false,
          },
          {
            type: "svm",
            address: "7K6r3x7y8jP2m6PV4m9WQbqv9cG7hX5aQk3bF1wVx5kD",
            chainId: null,
            isPrimary: true,
          },
        ],
      }),
      findByWalletAddress: vi.fn(),
    };

    const service = new PointService(pointRepository, userRepository);

    const result = await service.getMyPoints("u1");

    expect(result.balance).toBe(10);
    expect(result.walletAddress).toBe("7K6r3x7y8jP2m6PV4m9WQbqv9cG7hX5aQk3bF1wVx5kD");
  });

  it("ポイント加算後の結果を返す", async () => {
    const pointRepository: PointRepository = {
      getSnapshot: vi.fn(),
      getLeaderboard: vi.fn(),
      addPoints: vi.fn().mockResolvedValue({
        userId: "u2",
        balance: 55,
        transactions: [
          {
            id: "t1",
            userId: "u2",
            amount: 5,
            reason: "chat",
            idempotencyKey: "idem-1",
            createdAt: new Date("2026-02-13T00:00:00.000Z"),
          },
        ],
      }),
    };

    const userRepository: UserRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "u2",
        name: "alice",
        email: null,
        walletAddresses: [],
      }),
      findByWalletAddress: vi.fn(),
    };

    const service = new PointService(pointRepository, userRepository);

    const result = await service.addMyPoints({
      userId: "u2",
      amount: 5,
      reason: "chat",
      idempotencyKey: "idem-1",
    });

    expect(result.balance).toBe(55);
    expect(result.transactions[0]?.reason).toBe("chat");
  });

  it("UTC日次境界で leaderboard を返す", async () => {
    const mockGetLeaderboard = vi.fn().mockResolvedValue({
      total: [
        { userId: "u1", displayName: "Alice", points: 1200 },
        { userId: "u2", displayName: "Bob", points: 1100 },
      ],
      daily: [{ userId: "u2", displayName: "Bob", points: 80 }],
    });

    const pointRepository: PointRepository = {
      getSnapshot: vi.fn(),
      getLeaderboard: mockGetLeaderboard,
      addPoints: vi.fn(),
    };

    const userRepository: UserRepository = {
      findById: vi.fn(),
      findByWalletAddress: vi.fn(),
    };

    const now = new Date("2026-02-13T18:45:12.000Z");
    const service = new PointService(pointRepository, userRepository, () => now);

    const result = await service.getLeaderboard(20);

    expect(mockGetLeaderboard).toHaveBeenCalledWith({
      limit: 20,
      dailyStart: new Date("2026-02-13T00:00:00.000Z"),
      dailyEnd: new Date("2026-02-14T00:00:00.000Z"),
    });
    expect(result.dailyWindow.timezone).toBe("UTC");
    expect(result.total[0]).toEqual({ rank: 1, userId: "u1", displayName: "Alice", points: 1200 });
    expect(result.total[1]).toEqual({ rank: 2, userId: "u2", displayName: "Bob", points: 1100 });
    expect(result.daily[0]).toEqual({ rank: 1, userId: "u2", displayName: "Bob", points: 80 });
  });
});
