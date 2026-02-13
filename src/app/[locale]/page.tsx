import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Background } from "@/components/background";
import { BgmController } from "@/components/bgm-controller";
import { FooterLinks } from "@/components/footer-links";
import { ThreeViewer } from "@/components/three-viewer";
import { Link } from "@/i18n/navigation";

interface HomePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ params, searchParams }: HomePageProps) {
  await params;
  await searchParams;
  const t = await getTranslations("home");

  return (
    <div className="relative h-dvh overflow-hidden text-white">
      <Background />

      {/* 3D Viewer - 画面全体 */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="pointer-events-auto h-full w-full">
          <ThreeViewer />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-4 py-5 sm:px-8 sm:py-7">
        <header className="flex shrink-0 items-center justify-end">
          <BgmController />
        </header>

        <main className="flex min-h-0 flex-1 flex-col items-center gap-4 py-3 sm:gap-5 sm:py-4">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="marry.fun"
            priority
            width={720}
            height={240}
            className="relative -top-8 h-auto w-[min(540px,78vw)] shrink-0 animate-[logoIn_2800ms_cubic-bezier(0.22,1,0.36,1)_both] drop-shadow-[0_18px_60px_rgba(0,0,0,0.55)] motion-reduce:animate-none sm:-top-14"
          />

          {/* Spacer for layout */}
          <div className="min-h-0 flex-1" />

          <Link
            href="/start"
            className="shrink-0 rounded-full border-2 border-pink-200/40 bg-white/10 px-6 py-2.5 text-[clamp(0.9rem,2.5vw,1.25rem)] font-(--font-ephemeral) tracking-[0.28em] text-pink-100/80 drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-transform duration-150 ease-out hover:scale-105 active:scale-95 sm:px-8 sm:py-3"
          >
            {t("cta")}
          </Link>
        </main>

        <FooterLinks />
      </div>
    </div>
  );
}
