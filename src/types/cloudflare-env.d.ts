declare global {
  interface CloudflareEnv {
    DB?: D1Database;
    R2_BUCKET?: R2Bucket;
    PROFILE_IMAGES_BUCKET?: R2Bucket;
  }
}

export {};
