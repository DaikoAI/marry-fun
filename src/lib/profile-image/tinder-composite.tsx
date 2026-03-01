/* eslint-disable @next/next/no-img-element */

import { ImageResponse } from "next/og";

export const TINDER_PROFILE_COMPOSITE_SIZE = {
  width: 651,
  height: 1101,
} as const;

/** Tinder card base size requested by product (217x367), rendered at 3x for quality. */
export const TINDER_CARD_SIZE = {
  width: 217 * 3,
  height: 367 * 3,
} as const;

/** Customizable Tinder-style frame (border, corners). */
export interface TinderFrameOptions {
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

const DEFAULT_FRAME: Required<TinderFrameOptions> = {
  borderColor: "transparent",
  borderWidth: 0,
  borderRadius: 18,
};

interface TinderFrameStyles {
  outer: Required<TinderFrameOptions>;
  inner: {
    inset: number;
    borderRadius: number;
  };
}

export function resolveTinderFrameStyles(frame?: TinderFrameOptions): TinderFrameStyles {
  const outer: Required<TinderFrameOptions> = {
    ...DEFAULT_FRAME,
    ...frame,
  };
  const inset = Math.max(0, outer.borderWidth);

  return {
    outer,
    inner: {
      inset,
      borderRadius: Math.max(0, outer.borderRadius - inset),
    },
  };
}

export interface TinderProfileCompositeInput {
  /** Legacy: single full-bleed image (e.g. OG with stored composite URL). */
  imageUrl?: string;
  /** Optional background image behind the Tinder-style card. */
  backgroundImageUrl?: string;
  /** Character/avatar image inside the card. When set, card layout is used. */
  characterImageUrl?: string;
  name: string;
  location: string;
  tags: string[];
  badge: string;
  age?: number;
  university?: string;
  distanceKm?: number;
  /** Custom frame (border color, width, radius). */
  frame?: TinderFrameOptions;
}

function hasCardLayout(input: TinderProfileCompositeInput): boolean {
  return Boolean(input.characterImageUrl);
}

export function createTinderProfileCompositeImage(input: TinderProfileCompositeInput): ImageResponse {
  const tagsText = input.tags
    .slice(0, 2)
    .map(tag => `#${tag}`)
    .join("  ");

  const frameStyles = resolveTinderFrameStyles(input.frame);
  const age = input.age ?? 24;
  const university = input.university ?? "Keio University";
  const distance = input.distanceKm ?? 3;

  const isCardLayout = hasCardLayout(input);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#0f1115",
        color: "#fff",
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}
    >
      {isCardLayout && input.backgroundImageUrl ?
        <img
          src={input.backgroundImageUrl}
          alt=""
          width={TINDER_PROFILE_COMPOSITE_SIZE.width}
          height={TINDER_PROFILE_COMPOSITE_SIZE.height}
          style={{
            width: `${String(TINDER_PROFILE_COMPOSITE_SIZE.width)}px`,
            height: `${String(TINDER_PROFILE_COMPOSITE_SIZE.height)}px`,
            objectFit: "cover",
            position: "absolute",
            inset: 0,
          }}
        />
      : null}

      {!isCardLayout && input.imageUrl ?
        <img
          src={input.imageUrl}
          alt={input.name}
          width={TINDER_PROFILE_COMPOSITE_SIZE.width}
          height={TINDER_PROFILE_COMPOSITE_SIZE.height}
          style={{
            width: `${String(TINDER_PROFILE_COMPOSITE_SIZE.width)}px`,
            height: `${String(TINDER_PROFILE_COMPOSITE_SIZE.height)}px`,
            objectFit: "cover",
            position: "absolute",
            inset: 0,
          }}
        />
      : null}

      {isCardLayout && input.characterImageUrl ?
        <div
          style={{
            position: "absolute",
            left: (TINDER_PROFILE_COMPOSITE_SIZE.width - TINDER_CARD_SIZE.width) / 2,
            top: (TINDER_PROFILE_COMPOSITE_SIZE.height - TINDER_CARD_SIZE.height) / 2,
            width: TINDER_CARD_SIZE.width,
            height: TINDER_CARD_SIZE.height,
            borderRadius: frameStyles.outer.borderRadius,
            border: `${String(frameStyles.outer.borderWidth)}px solid ${frameStyles.outer.borderColor}`,
            display: "flex",
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              position: "relative",
              margin: frameStyles.inner.inset,
              width: TINDER_CARD_SIZE.width - frameStyles.inner.inset * 2,
              height: TINDER_CARD_SIZE.height - frameStyles.inner.inset * 2,
              borderRadius: frameStyles.inner.borderRadius,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <img
              src={input.characterImageUrl}
              alt={input.name}
              width={TINDER_CARD_SIZE.width}
              height={TINDER_CARD_SIZE.height}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                background: "linear-gradient(180deg, rgba(0,0,0,0) 44%, rgba(0,0,0,0.18) 64%, rgba(0,0,0,0.8) 100%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 36,
                right: 36,
                bottom: 34,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <div style={{ display: "flex", fontSize: 62, fontWeight: 700, lineHeight: 1 }}>{input.name}</div>
                <div style={{ display: "flex", fontSize: 48, fontWeight: 600, lineHeight: 1, opacity: 0.92 }}>{age}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, fontWeight: 500, opacity: 0.96 }}>
                <div
                  style={{
                    width: 22,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.95)",
                    borderRadius: 3,
                    display: "flex",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 4,
                      right: 4,
                      top: 4,
                      height: 2,
                      background: "rgba(255,255,255,0.95)",
                    }}
                  />
                </div>
                <div style={{ display: "flex" }}>{university}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, fontWeight: 500, opacity: 0.96 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    border: "2px solid rgba(255,255,255,0.95)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.95)",
                    }}
                  />
                </div>
                <div style={{ display: "flex" }}>{`${String(distance)} miles away`}</div>
              </div>
            </div>
          </div>
        </div>
      : null}

      {!isCardLayout && input.imageUrl ?
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.22) 35%, rgba(0,0,0,0.74) 100%)",
            }}
          />
          <div
            style={{
              marginTop: "auto",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "0 56px 72px",
            }}
          >
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{input.name}</div>
            <div style={{ display: "flex", fontSize: 34, opacity: 0.95 }}>Location: {input.location}</div>
            <div style={{ display: "flex", fontSize: 28, opacity: 0.92 }}>{tagsText}</div>
            <div style={{ display: "flex", fontSize: 28, opacity: 0.9 }}>made with marry.fun</div>
          </div>
        </>
      : null}
    </div>,
    {
      ...TINDER_PROFILE_COMPOSITE_SIZE,
    },
  );
}
