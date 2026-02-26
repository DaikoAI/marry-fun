import { ImageResponse } from "next/og";

export const TINDER_PROFILE_COMPOSITE_SIZE = {
  width: 1200,
  height: 1500,
} as const;

export interface TinderProfileCompositeInput {
  imageUrl: string;
  name: string;
  location: string;
  tags: string[];
  badge: string;
}

export function createTinderProfileCompositeImage(input: TinderProfileCompositeInput): ImageResponse {
  const tagsText = input.tags
    .slice(0, 3)
    .map(tag => `#${tag}`)
    .join("  ");

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
        borderRadius: 42,
        border: "10px solid rgba(255,255,255,0.92)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og ImageResponse requires plain img source usage */}
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
    </div>,
    {
      ...TINDER_PROFILE_COMPOSITE_SIZE,
    },
  );
}
