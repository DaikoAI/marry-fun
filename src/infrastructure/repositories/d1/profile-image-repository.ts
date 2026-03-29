import { eq } from "drizzle-orm";

import { getDb } from "@/infrastructure/db/client";
import { user, xAccount } from "@/infrastructure/db/schema";

export interface ProfileImageGenerationContext {
  username: string | null;
  userImage: string | null;
  xUsername: string | null;
  xProfileImageUrl: string | null;
}

export class D1ProfileImageRepository {
  async getGenerationContext(userId: string): Promise<ProfileImageGenerationContext | null> {
    const db = await getDb();
    const userRows = await db
      .select({
        username: user.name,
        userImage: user.image,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRows[0]) return null;

    const xRows = await db
      .select({
        xUsername: xAccount.username,
        xProfileImageUrl: xAccount.profileImageUrl,
      })
      .from(xAccount)
      .where(eq(xAccount.userId, userId))
      .limit(1);

    return {
      username: userRows[0].username ?? null,
      userImage: userRows[0].userImage ?? null,
      xUsername: xRows[0]?.xUsername ?? null,
      xProfileImageUrl: xRows[0]?.xProfileImageUrl ?? null,
    };
  }

  async updateGeneratedProfileImage(userId: string, imageUrl: string): Promise<void> {
    const db = await getDb();
    await db.update(user).set({ image: imageUrl }).where(eq(user.id, userId));
  }
}
