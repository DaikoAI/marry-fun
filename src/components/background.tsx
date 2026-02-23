import Image from "next/image";

type BackgroundVariant = "top" | "chat";

interface BackgroundProps {
  variant?: BackgroundVariant;
}

export function Background({ variant = "top" }: BackgroundProps) {
  const imageSrc = variant === "chat" ? "/bg/chat.webp" : "/bg/top.webp";

  return (
    <>
      <Image src={imageSrc} alt="" fill priority sizes="100vw" className="object-cover object-center" />
      <div className="marry-sparkles pointer-events-none absolute inset-0 opacity-70 motion-reduce:hidden" />
    </>
  );
}
