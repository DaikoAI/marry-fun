import { StartPageClient } from "./start/start-page-client";

interface StartRootPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StartRootPage({ params, searchParams }: StartRootPageProps) {
  await params;
  await searchParams;
  return <StartPageClient />;
}
