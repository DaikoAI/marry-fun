import { permanentRedirect } from "next/navigation";

interface StartPageProps {
  params: Promise<{ locale: string }>;
}

export default async function StartPage({ params }: StartPageProps) {
  const { locale } = await params;
  permanentRedirect(`/${locale}`);
}
