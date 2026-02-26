import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const mockGenerateProfileBackgroundWithRunware = vi.fn();
const mockGenerateProfileImageWithRunware = vi.fn();
const mockCreateTinderProfileCompositeImage = vi.fn<(input: unknown) => { arrayBuffer: () => Promise<ArrayBuffer> }>();
const mockUploadProfileCompositeImageToR2 = vi.fn();
const getGenerationContextMock = vi.fn();
const updateGeneratedProfileImageMock = vi.fn();
const fetchMock = vi.fn();
const originalFetch = globalThis.fetch;

function readCompositeInput(): { backgroundImageUrl: string; characterImageUrl: string; name: string | undefined } {
  const input = mockCreateTinderProfileCompositeImage.mock.calls.at(-1)?.[0];
  if (!input || typeof input !== "object") {
    throw new TypeError("composite input is missing");
  }

  const record = input as Record<string, unknown>;
  const backgroundImageUrl = record.backgroundImageUrl;
  const characterImageUrl = record.characterImageUrl;

  if (typeof backgroundImageUrl !== "string" || typeof characterImageUrl !== "string") {
    throw new TypeError("composite image urls must be strings");
  }

  return {
    backgroundImageUrl,
    characterImageUrl,
    name: typeof record.name === "string" ? record.name : undefined,
  };
}

vi.mock("@/lib/auth/server-session", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/runware/profile-image", () => ({
  generateProfileBackgroundWithRunware: mockGenerateProfileBackgroundWithRunware,
  generateProfileImageWithRunware: mockGenerateProfileImageWithRunware,
}));

vi.mock("@/lib/profile-image/tinder-composite", () => ({
  createTinderProfileCompositeImage: mockCreateTinderProfileCompositeImage,
}));

vi.mock("@/infrastructure/storage/r2/profile-image-storage", () => ({
  uploadProfileCompositeImageToR2: mockUploadProfileCompositeImageToR2,
}));

vi.mock("@/infrastructure/repositories/d1/profile-image-repository", () => ({
  D1ProfileImageRepository: class {
    getGenerationContext = getGenerationContextMock;
    updateGeneratedProfileImage = updateGeneratedProfileImageMock;
  },
}));

const { POST } = await import("@/app/api/profile-image/generate/route");

describe("POST /api/profile-image/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = fetchMock as typeof fetch;
    mockGetServerSession.mockResolvedValue({
      user: { id: "u1", name: "alice" },
    });
    getGenerationContextMock.mockResolvedValue({
      username: "alice",
      xUsername: "alice_x",
      xProfileImageUrl: "https://pbs.twimg.com/profile_images/123/avatar.jpg",
    });
    mockGenerateProfileBackgroundWithRunware.mockResolvedValue({
      imageUrl: "https://im.runware.ai/generated-background.webp",
    });
    mockGenerateProfileImageWithRunware.mockResolvedValue({
      imageUrl: "https://im.runware.ai/generated-avatar.webp",
    });
    mockCreateTinderProfileCompositeImage.mockReturnValue({
      arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode("png-bytes").buffer),
    });
    mockUploadProfileCompositeImageToR2.mockResolvedValue({
      key: "profile-image/u1/2026-02-24/uuid.png",
      publicUrl: "https://cdn.example.com/profile-image/u1/2026-02-24/uuid.png",
    });
    updateGeneratedProfileImageMock.mockResolvedValue(undefined);
    // Return a fresh Response per fetch (background + character) so body is not "already used"
    fetchMock.mockImplementation(async () =>
      Promise.resolve(
        new Response(new Uint8Array([0x52, 0x49, 0x46, 0x46]), {
          status: 200,
          headers: { "content-type": "image/webp" },
        }),
      ),
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("未ログインは 401", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const req = new Request("http://localhost:8787/api/profile-image/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "ja" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({ message: "Unauthorized" });
  });

  it("X icon がない場合は 409", async () => {
    getGenerationContextMock.mockResolvedValueOnce({
      username: "alice",
      xUsername: "alice_x",
      xProfileImageUrl: null,
    });
    const req = new Request("http://localhost:8787/api/profile-image/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "ja" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toEqual({ message: "X profile image is required" });
    expect(mockGenerateProfileImageWithRunware).not.toHaveBeenCalled();
  });

  it("Runware 背景・キャラ生成結果を合成して user.image に保存して返す", async () => {
    const req = new Request("http://localhost:8787/api/profile-image/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "ja", seed: 42 }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGenerateProfileBackgroundWithRunware).toHaveBeenCalledWith({ seed: 42 });
    expect(mockGenerateProfileImageWithRunware).toHaveBeenCalledWith({
      locale: "ja",
      seed: 42,
      inputFaceImageUrl: "https://pbs.twimg.com/profile_images/123/avatar.jpg",
      displayName: "alice",
      xUsername: "alice_x",
    });
    const compositeInput = readCompositeInput();
    expect(compositeInput.backgroundImageUrl).toMatch(/^data:image\/webp;base64,/);
    expect(compositeInput.characterImageUrl).toMatch(/^data:image\/webp;base64,/);
    expect(compositeInput.name).toBe("alice");
    expect(mockUploadProfileCompositeImageToR2).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        contentType: "image/png",
      }),
    );
    expect(updateGeneratedProfileImageMock).toHaveBeenCalledWith(
      "u1",
      "https://cdn.example.com/profile-image/u1/2026-02-24/uuid.png",
    );
    expect(json).toEqual({ imageUrl: "https://cdn.example.com/profile-image/u1/2026-02-24/uuid.png" });
  });

  it("Runware 背景・キャラ画像を取得して data URL 化した内容で合成する", async () => {
    const req = new Request("http://localhost:8787/api/profile-image/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "en" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith("https://im.runware.ai/generated-background.webp", {
      cache: "no-store",
    });
    expect(fetchMock).toHaveBeenCalledWith("https://im.runware.ai/generated-avatar.webp", {
      cache: "no-store",
    });
    const compositeInput = readCompositeInput();
    expect(compositeInput.backgroundImageUrl).toMatch(/^data:image\/webp;base64,/);
    expect(compositeInput.characterImageUrl).toMatch(/^data:image\/webp;base64,/);
  });
});
