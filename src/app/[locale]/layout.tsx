import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Shippori_Mincho, Yuji_Syuku } from "next/font/google";

import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import { QueryClientProviderWrapper } from "@/components/providers/query-client-provider";
import { SolanaWalletProvider } from "@/components/providers/solana-wallet-provider";
import { routing } from "@/i18n/routing";

import "../globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shipporiMincho = Shippori_Mincho({
  variable: "--font-tokimeki",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const yujiSyuku = Yuji_Syuku({
  variable: "--font-ephemeral",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    images: [
      {
        url: "/ogp.png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${shipporiMincho.variable} ${yujiSyuku.variable} h-full antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <QueryClientProviderWrapper>
            <SolanaWalletProvider>{children}</SolanaWalletProvider>
          </QueryClientProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
