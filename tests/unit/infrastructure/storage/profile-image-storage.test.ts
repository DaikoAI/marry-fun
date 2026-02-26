import { beforeEach, describe, expect, it, vi } from "vitest";

const getCloudflareContextMock = vi.fn();
const mockEnv = {
  R2_PROFILE_IMAGE_PUBLIC_BASE_URL: "https://cdn.example.com" as string | undefined,
};

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: getCloudflareContextMock,
}));

vi.mock("@/env", () => ({
  env: mockEnv,
}));

const { uploadProfileCompositeImageToR2 } = await import("@/infrastructure/storage/r2/profile-image-storage");

describe("uploadProfileCompositeImageToR2", () => {
  const bucketPutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.R2_PROFILE_IMAGE_PUBLIC_BASE_URL = "https://cdn.example.com";
    getCloudflareContextMock.mockResolvedValue({
      env: {
        PROFILE_IMAGES_BUCKET: {
          put: bucketPutMock,
        },
      },
    });
    bucketPutMock.mockResolvedValue({});
  });

  it("R2にputして公開URLを返す", async () => {
    const result = await uploadProfileCompositeImageToR2({
      userId: "user-1",
      imageBytes: new ArrayBuffer(3),
      contentType: "image/png",
    });

    expect(bucketPutMock).toHaveBeenCalledTimes(1);
    const [key, , options] = bucketPutMock.mock.calls[0] as [string, ArrayBuffer, Record<string, unknown>];
    expect(key).toMatch(/^profile-image\/user-1\/\d{4}-\d{2}-\d{2}\/.+\.png$/);
    expect(options).toMatchObject({
      httpMetadata: {
        contentType: "image/png",
      },
    });
    expect(result.key).toBe(key);
    expect(result.publicUrl).toBe(`https://cdn.example.com/${key}`);
  });

  it("公開URLのベース未設定なら失敗する", async () => {
    mockEnv.R2_PROFILE_IMAGE_PUBLIC_BASE_URL = undefined;

    await expect(
      uploadProfileCompositeImageToR2({
        userId: "u1",
        imageBytes: new ArrayBuffer(3),
        contentType: "image/png",
      }),
    ).rejects.toThrow("R2_PROFILE_IMAGE_PUBLIC_BASE_URL is not configured");
  });
});
