import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const mockGenerateProfileImageWithRunware = vi.fn();
const mockCreateTinderProfileCompositeImage = vi.fn();
const mockUploadProfileCompositeImageToR2 = vi.fn();
const getGenerationContextMock = vi.fn();
const updateGeneratedProfileImageMock = vi.fn();

vi.mock("@/lib/auth/server-session", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/runware/profile-image", () => ({
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
    mockGetServerSession.mockResolvedValue({
      user: { id: "u1", name: "alice" },
    });
    getGenerationContextMock.mockResolvedValue({
      username: "alice",
      xUsername: "alice_x",
      xProfileImageUrl: "https://pbs.twimg.com/profile_images/123/avatar.jpg",
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

  it("Runware 生成結果を user.image に保存して返す", async () => {
    const req = new Request("http://localhost:8787/api/profile-image/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "ja", seed: 42 }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockGenerateProfileImageWithRunware).toHaveBeenCalledWith({
      locale: "ja",
      seed: 42,
      inputFaceImageUrl: "https://pbs.twimg.com/profile_images/123/avatar.jpg",
      displayName: "alice",
      xUsername: "alice_x",
    });
    expect(mockCreateTinderProfileCompositeImage).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://im.runware.ai/generated-avatar.webp",
        name: "alice",
      }),
    );
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
});
