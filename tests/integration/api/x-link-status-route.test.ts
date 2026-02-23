import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const hasWalletMock = vi.fn();
const findTwitterAccountMock = vi.fn();
const upsertFromTwitterAccountMock = vi.fn();

vi.mock("@/lib/auth/server-session", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/infrastructure/repositories/d1/x-account-repository", () => {
  return {
    D1XAccountRepository: class {
      hasSvmWallet = hasWalletMock;
      findTwitterAccountByUserId = findTwitterAccountMock;
      upsertFromTwitterAccount = upsertFromTwitterAccountMock;
    },
  };
});

const { GET } = await import("@/app/api/auth/x/link-status/route");

describe("GET /api/auth/x/link-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "u1" } });
    hasWalletMock.mockResolvedValue(true);
    findTwitterAccountMock.mockResolvedValue(null);
    upsertFromTwitterAccountMock.mockResolvedValue({ providerAccountId: "x-acc-1", username: null });
  });

  it("未ログインは 401 を返す", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await GET(new Request("http://localhost:8787/api/auth/x/link-status"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({ message: "Unauthorized" });
  });

  it("wallet 未認証ユーザーは 403 を返す", async () => {
    hasWalletMock.mockResolvedValueOnce(false);

    const res = await GET(new Request("http://localhost:8787/api/auth/x/link-status"));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json).toEqual({ message: "Wallet authentication required", linked: false });
  });

  it("wallet 認証済みでも X 未連携なら linked:false を返す", async () => {
    findTwitterAccountMock.mockResolvedValueOnce(null);

    const res = await GET(new Request("http://localhost:8787/api/auth/x/link-status"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ linked: false });
    expect(upsertFromTwitterAccountMock).not.toHaveBeenCalled();
  });

  it("wallet 認証済みで X 連携済みなら linked:true を返す", async () => {
    findTwitterAccountMock.mockResolvedValueOnce({
      id: "acc-twitter-1",
      accountId: "x-provider-account-1",
    });
    upsertFromTwitterAccountMock.mockResolvedValueOnce({
      providerAccountId: "x-provider-account-1",
      username: "claw_chan_fan",
    });

    const res = await GET(new Request("http://localhost:8787/api/auth/x/link-status"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      linked: true,
      providerAccountId: "x-provider-account-1",
      username: "claw_chan_fan",
    });
    expect(upsertFromTwitterAccountMock).toHaveBeenCalledWith({
      userId: "u1",
      accountId: "acc-twitter-1",
      providerAccountId: "x-provider-account-1",
    });
  });
});
