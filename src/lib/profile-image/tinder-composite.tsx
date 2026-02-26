/* eslint-disable @next/next/no-img-element */

import { ImageResponse } from "next/og";

export const TINDER_PROFILE_COMPOSITE_SIZE = {
  width: 1200,
  height: 1500,
} as const;

/** Card inner size (4:5) and position for Tinder-style frame. */
export const TINDER_CARD_SIZE = {
  width: 840,
  height: 1050,
} as const;

/** Customizable Tinder-style frame (border, corners). */
export interface TinderFrameOptions {
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

const DEFAULT_FRAME: Required<TinderFrameOptions> = {
  borderColor: "#8B5CF6",
  borderWidth: 10,
  borderRadius: 32,
};

export interface TinderProfileCompositeInput {
  /** Legacy: single full-bleed image (e.g. OG with stored composite URL). */
  imageUrl?: string;
  /** New: background image (Runware brick texture) behind the card. */
  backgroundImageUrl?: string;
  /** New: character/avatar image inside the card. When set with backgroundImageUrl, card layout is used. */
  characterImageUrl?: string;
  name: string;
  location: string;
  tags: string[];
  badge: string;
  /** Custom frame (border color, width, radius). Default: purple neon-style border. */
  frame?: TinderFrameOptions;
}

function hasCardLayout(input: TinderProfileCompositeInput): boolean {
  return Boolean(input.backgroundImageUrl && input.characterImageUrl);
}

export function createTinderProfileCompositeImage(input: TinderProfileCompositeInput): ImageResponse {
  const tagsText = input.tags
    .slice(0, 3)
    .map(tag => `#${tag}`)
    .join("  ");

  const frame: Required<TinderFrameOptions> = {
    ...DEFAULT_FRAME,
    ...input.frame,
  };

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
      {/* Background: full canvas */}
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

      {/* Legacy: single full-bleed image */}
      {!isCardLayout && input.imageUrl ?
        <>
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
        </>
      : null}

      {/* Front: Tinder-style card (custom frame) with character inside */}
      {isCardLayout && input.characterImageUrl ?
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: TINDER_CARD_SIZE.width,
            height: TINDER_CARD_SIZE.height,
            borderRadius: frame.borderRadius,
            border: `${String(frame.borderWidth)}px solid ${frame.borderColor}`,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          }}
        >
          <img
            src={input.characterImageUrl}
            alt={input.name}
            width={TINDER_CARD_SIZE.width}
            height={TINDER_CARD_SIZE.height}
            style={{
              width: `${String(TINDER_CARD_SIZE.width)}px`,
              height: `${String(TINDER_CARD_SIZE.height)}px`,
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
              background: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.22) 35%, rgba(0,0,0,0.74) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              border: "2px solid rgba(255,255,255,0.88)",
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 1,
              background: "rgba(0,0,0,0.28)",
            }}
          >
            {input.badge}
          </div>
          <div
            style={{
              marginTop: "auto",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "0 40px 48px",
            }}
          >
            <div style={{ display: "flex", fontSize: 48, fontWeight: 700, lineHeight: 1.1 }}>{input.name}</div>
            <div style={{ display: "flex", fontSize: 26, opacity: 0.95 }}>Location: {input.location}</div>
            <div style={{ display: "flex", fontSize: 22, opacity: 0.92 }}>{tagsText}</div>
            <div style={{ display: "flex", fontSize: 20, opacity: 0.9 }}>made with marry.fun</div>
          </div>
        </div>
      : null}

      {/* Legacy overlay when single image (no card) */}
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
              position: "absolute",
              top: 42,
              right: 42,
              border: "2px solid rgba(255,255,255,0.88)",
              borderRadius: 999,
              padding: "10px 20px",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 1,
              background: "rgba(0,0,0,0.28)",
            }}
          >
            {input.badge}
          </div>
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
