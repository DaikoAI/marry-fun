import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { buildXIntentUrl } from "@/lib/result-share";
import {
  TINDER_PROFILE_AGES,
  TINDER_PROFILE_BADGES,
  TINDER_PROFILE_DISTANCE_KM,
  TINDER_PROFILE_LOCATIONS,
  TINDER_PROFILE_TAGS,
  TINDER_PROFILE_UNIVERSITIES,
} from "@/constants/profile-share/tinder";

interface ProfileShareTokenPayload {
  userId: string;
  locale: "ja" | "en";
  imageUrl: string;
  name: string;
  location: string;
  tags: string[];
  iat: number;
}

export interface ProfileShareData {
  userId: string;
  locale: "ja" | "en";
  imageUrl: string;
  name: string;
  location: string;
  tags: string[];
}

export interface DailyProfileDecorations {
  location: string;
  tags: string[];
  badge: string;
  age: number;
  university: string;
  distanceKm: number;
}

function hashToUint32(input: string): number {
  const hash = createHash("sha256").update(input).digest();
  return hash.readUInt32BE(0);
}

export function pickDailyProfileDecorations(input: { userId: string; dateKey: string }): DailyProfileDecorations {
  const seed = hashToUint32(`${input.userId}:${input.dateKey}`);
  const location = TINDER_PROFILE_LOCATIONS[seed % TINDER_PROFILE_LOCATIONS.length];
  const tag1 = TINDER_PROFILE_TAGS[seed % TINDER_PROFILE_TAGS.length];
  const tag2 = TINDER_PROFILE_TAGS[(seed + 3) % TINDER_PROFILE_TAGS.length];
  const badge = TINDER_PROFILE_BADGES[seed % TINDER_PROFILE_BADGES.length];
  const age = TINDER_PROFILE_AGES[seed % TINDER_PROFILE_AGES.length];
  const university = TINDER_PROFILE_UNIVERSITIES[seed % TINDER_PROFILE_UNIVERSITIES.length];
  const distanceKm = TINDER_PROFILE_DISTANCE_KM[seed % TINDER_PROFILE_DISTANCE_KM.length];

  return {
    location,
    tags: [tag1, tag2],
    badge,
    age,
    university,
    distanceKm,
  };
}

export function pickRandomProfileDecorations(): DailyProfileDecorations {
  const location = TINDER_PROFILE_LOCATIONS[Math.floor(Math.random() * TINDER_PROFILE_LOCATIONS.length)];
  const tag1 = TINDER_PROFILE_TAGS[Math.floor(Math.random() * TINDER_PROFILE_TAGS.length)];
  const tag2 = TINDER_PROFILE_TAGS[Math.floor(Math.random() * TINDER_PROFILE_TAGS.length)];
  const badge = TINDER_PROFILE_BADGES[Math.floor(Math.random() * TINDER_PROFILE_BADGES.length)];
  const age = TINDER_PROFILE_AGES[Math.floor(Math.random() * TINDER_PROFILE_AGES.length)];
  const university = TINDER_PROFILE_UNIVERSITIES[Math.floor(Math.random() * TINDER_PROFILE_UNIVERSITIES.length)];
  const distanceKm = TINDER_PROFILE_DISTANCE_KM[Math.floor(Math.random() * TINDER_PROFILE_DISTANCE_KM.length)];

  return {
    location,
    tags: [tag1, tag2],
    badge,
    age,
    university,
    distanceKm,
  };
}

function signBody(bodyBase64: string, secret: string): string {
  return createHmac("sha256", secret).update(bodyBase64).digest("base64url");
}

export function createProfileShareToken(data: ProfileShareData, secret: string): string {
  const payload: ProfileShareTokenPayload = {
    ...data,
    iat: Date.now(),
  };

  const bodyBase64 = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = signBody(bodyBase64, secret);
  return `${bodyBase64}.${signature}`;
}

export function decodeProfileShareToken(token: string, secret: string): ProfileShareData | null {
  const [bodyBase64, signature, ...rest] = token.split(".");
  if (!bodyBase64 || !signature || rest.length > 0) return null;

  const expected = signBody(bodyBase64, secret);
  const expectedBuffer = Buffer.from(expected, "utf-8");
  const signatureBuffer = Buffer.from(signature, "utf-8");
  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    const raw: unknown = JSON.parse(Buffer.from(bodyBase64, "base64url").toString("utf-8"));
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const parsed = raw as Record<string, unknown>;
    const localeRaw = parsed.locale;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.imageUrl !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.location !== "string" ||
      !Array.isArray(parsed.tags)
    ) {
      return null;
    }

    if (localeRaw !== "ja" && localeRaw !== "en") {
      return null;
    }

    return {
      userId: parsed.userId,
      locale: localeRaw,
      imageUrl: parsed.imageUrl,
      name: parsed.name,
      location: parsed.location,
      tags: parsed.tags.filter(tag => typeof tag === "string"),
    };
  } catch {
    return null;
  }
}

export function buildProfileShareIntentUrl(input: { text: string; url: string }): string {
  return buildXIntentUrl(input.text, input.url);
}
