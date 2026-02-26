import Image from "next/image";

type BackgroundVariant = "top" | "chat";

interface BackgroundProps {
  variant?: BackgroundVariant;
}

export function Background({ variant = "top" }: BackgroundProps) {
  const isTop = variant === "top";
  const imageSrc = variant === "chat" ? "/bg/chat.webp" : "/bg/top.webp";

  return (
    <>
      <Image src={imageSrc} alt="" fill priority sizes="100vw" className="object-cover object-center" />
      {isTop && <div className="pointer-events-none absolute inset-0 bg-black/40" />}
      {isTop && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_45%,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.35)_65%,rgba(0,0,0,0.55)_100%)]" />
      )}
      <div
        className={`marry-sparkles pointer-events-none absolute inset-0 ${
          isTop ? "opacity-35" : "opacity-70"
        } motion-reduce:hidden`}
      />
    </>
  );
}
