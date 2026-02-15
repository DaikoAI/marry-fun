import Image from "next/image";

export function Background() {
  return (
    <>
      <Image src="/bg.webp" alt="" fill priority sizes="100vw" className="object-cover object-center" />
      <div className="marry-sparkles pointer-events-none absolute inset-0 opacity-70 motion-reduce:hidden" />
    </>
  );
}
