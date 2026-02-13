import { ChatPageClient } from "./chat-page-client";

interface ChatPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  await params;
  await searchParams;
  return <ChatPageClient />;
}
