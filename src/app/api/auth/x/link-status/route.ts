import { NextResponse } from "next/server";

import { D1XAccountRepository } from "@/infrastructure/repositories/d1/x-account-repository";
import { getServerSession } from "@/lib/auth/server-session";

interface XProfile {
  username: string | null;
  profileImageUrl: string | null;
}

function readXProfile(payload: unknown): XProfile | null {
  if (!payload || typeof payload !== "object" || !("data" in payload) || typeof payload.data !== "object") {
    return null;
  }

  const data = payload.data;
  if (!data || typeof data !== "object") {
    return null;
  }

  const username = "username" in data && typeof data.username === "string" ? data.username : null;
  const profileImageUrl =
    "profile_image_url" in data && typeof data.profile_image_url === "string" ? data.profile_image_url : null;

  if (!username && !profileImageUrl) {
    return null;
  }

  return {
    username,
    profileImageUrl,
  };
}

async function fetchXProfile(accessToken: string): Promise<XProfile | null> {
  try {
    const response = await fetch("https://api.twitter.com/2/users/me?user.fields=username,profile_image_url", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json().catch(() => null);
    return readXProfile(payload);
  } catch {
    return null;
  }
}

export async function GET(_request: Request) {
  const session = await getServerSession();
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const repository = new D1XAccountRepository();
  const [hasWallet, twitterAccount] = await Promise.all([
    repository.hasSvmWallet(userId),
    repository.findTwitterAccountByUserId(userId),
  ]);

  if (!hasWallet) {
    return NextResponse.json({ message: "Wallet authentication required", linked: false }, { status: 403 });
  }

  if (!twitterAccount) {
    return NextResponse.json({ linked: false });
  }

  const linkedAccount = await repository.upsertFromTwitterAccount({
    userId,
    accountId: twitterAccount.id,
    providerAccountId: twitterAccount.accountId,
  });

  const hasMissingProfileData = !linkedAccount.username || !linkedAccount.profileImageUrl;
  let profile = {
    username: linkedAccount.username,
    profileImageUrl: linkedAccount.profileImageUrl,
  };

  if (hasMissingProfileData && twitterAccount.accessToken) {
    const latestProfile = await fetchXProfile(twitterAccount.accessToken);
    if (latestProfile) {
      const hydratedAccount = await repository.upsertFromTwitterAccount({
        userId,
        accountId: twitterAccount.id,
        providerAccountId: twitterAccount.accountId,
        username: latestProfile.username,
        profileImageUrl: latestProfile.profileImageUrl,
      });

      profile = {
        username: hydratedAccount.username,
        profileImageUrl: hydratedAccount.profileImageUrl,
      };
    }
  }

  return NextResponse.json({
    linked: true,
    providerAccountId: linkedAccount.providerAccountId,
    username: profile.username,
    profileImageUrl: profile.profileImageUrl,
  });
}
