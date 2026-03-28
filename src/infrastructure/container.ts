import type { NgWordCachePort } from "@/domain/repositories/ng-word-cache-port";
import { GameSessionUseCase } from "@/usecase/chat";
import { AiChatVercelAgent } from "./adapter/ai-chat-vercel-agent";
import { D1GameSessionRepository } from "./repositories/d1/game-session-repository";
import { NgWordCache } from "./repositories/ng-word-cache";

const repo = new D1GameSessionRepository();
const ngWordCache: NgWordCachePort = new NgWordCache();

const aiClient = new AiChatVercelAgent();

export const gameSessionUseCase = new GameSessionUseCase(repo, aiClient, ngWordCache);
