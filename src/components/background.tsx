import Image from "next/image";

interface BackgroundProps {
  src?: string;
  showSparkles?: boolean;
  imageClassName?: string;
}

export function Background({
  src = "/bg.webp",
  showSparkles = true,
  imageClassName = "object-cover object-center",
}: BackgroundProps) {
  return (
    <>
      <Image src={src} alt="" fill priority sizes="100vw" className={imageClassName} />
      {showSparkles && (
        <div className="marry-sparkles pointer-events-none absolute inset-0 opacity-70 motion-reduce:hidden" />
      )}
    </>
  );
}
