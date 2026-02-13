import { StartPageClient } from "./start-page-client";

interface StartPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StartPage({ params, searchParams }: StartPageProps) {
  await params;
  await searchParams;
  return <StartPageClient />;
}
