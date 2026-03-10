import Image from "next/image";

interface BackgroundProps {
  src?: string;
  mobileSrc?: string;
  desktopSrc?: string;
  showSparkles?: boolean;
  imageClassName?: string;
}

export function Background({
  src = "/bg.webp",
  mobileSrc,
  desktopSrc,
  showSparkles = true,
  imageClassName = "object-cover object-center",
}: BackgroundProps) {
  const mobileImageSrc = mobileSrc ?? src;
  const desktopImageSrc = desktopSrc ?? src;

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
      : <Image src={src} alt="" fill priority sizes="100vw" className={imageClassName} />}
      {showSparkles && (
        <div className="marry-sparkles pointer-events-none absolute inset-0 opacity-70 motion-reduce:hidden" />
      )}
    </>
  );
}
