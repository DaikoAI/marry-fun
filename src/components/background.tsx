import Image from "next/image";

type BackgroundVariant = "top" | "chat";

interface BackgroundProps {
  src?: string;
  mobileSrc?: string;
  desktopSrc?: string;
  showSparkles?: boolean;
  imageClassName?: string;
  variant?: BackgroundVariant;
}

export function Background({
  src = "/bg.webp",
  mobileSrc,
  desktopSrc,
  showSparkles = true,
  imageClassName = "object-cover object-center",
  variant,
}: BackgroundProps) {
  const variantSrc =
    variant === "chat" ? "/bg/chat.webp"
    : variant === "top" ? "/bg/top.webp"
    : undefined;
  const baseSrc = variantSrc ?? src;
  const mobileImageSrc = mobileSrc ?? baseSrc;
  const desktopImageSrc = desktopSrc ?? baseSrc;

  return (
    <>
      {mobileSrc || desktopSrc ?
        <>
          <Image src={mobileImageSrc} alt="" fill priority sizes="100vw" className={`${imageClassName} sm:hidden`} />
          <Image
            src={desktopImageSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`${imageClassName} hidden sm:block`}
          />
        </>
      : <Image src={baseSrc} alt="" fill priority sizes="100vw" className={imageClassName} />}
      {showSparkles && (
        <div className="marry-sparkles pointer-events-none absolute inset-0 opacity-70 motion-reduce:hidden" />
      )}
    </>
  );
}
