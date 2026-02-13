import { beforeEach, describe, expect, it, vi } from "vitest";

const findByWalletAddressMock = vi.fn();

vi.mock("@/infrastructure/repositories/d1/user-repository", () => {
  return {
    D1UserRepository: class {
      findByWalletAddress = findByWalletAddressMock;
    },
  };
});

const { GET } = await import("@/app/api/auth/wallet-status/route");

describe("GET /api/auth/wallet-status", () => {
  beforeEach(() => {
    findByWalletAddressMock.mockReset();
  });

  it("walletAddress が不正な形式なら 400 を返す", async () => {
    const req = new Request("http://localhost:8787/api/auth/wallet-status?walletAddress=invalid", {
      method: "GET",
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({ message: "Invalid walletAddress" });
  });

  it("未登録ウォレットなら requiresUsername: true を返す", async () => {
    findByWalletAddressMock.mockResolvedValueOnce(null);

    const req = new Request(
      "http://localhost:8787/api/auth/wallet-status?walletAddress=7K6r3x7y8jP2m6PV4m9WQbqv9cG7hX5aQk3bF1wVx5kD",
      { method: "GET" },
    );

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      exists: false,
      requiresUsername: true,
    });
  });

  it("既存かつ有効 username ありなら requiresUsername: false を返す", async () => {
    findByWalletAddressMock.mockResolvedValueOnce({
      id: "u1",
      name: "alice",
      email: null,
      walletAddresses: [],
    });

    const req = new Request(
      "http://localhost:8787/api/auth/wallet-status?walletAddress=7K6r3x7y8jP2m6PV4m9WQbqv9cG7hX5aQk3bF1wVx5kD",
      { method: "GET" },
    );

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      exists: true,
      requiresUsername: false,
    });
  });

  it("既存でも username が空なら requiresUsername: true を返す", async () => {
    findByWalletAddressMock.mockResolvedValueOnce({
      id: "u2",
      name: "",
      email: null,
      walletAddresses: [],
    });

    const req = new Request(
      "http://localhost:8787/api/auth/wallet-status?walletAddress=7K6r3x7y8jP2m6PV4m9WQbqv9cG7hX5aQk3bF1wVx5kD",
      { method: "GET" },
    );

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      exists: true,
      requiresUsername: true,
    });
  });
});
