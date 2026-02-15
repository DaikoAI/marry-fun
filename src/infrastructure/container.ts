import type { NgWordCachePort } from "@/domain/repositories/ng-word-cache-port";
import { env } from "@/env";
import { GameSessionUseCase } from "@/usecase/chat";
import { AiChatMoltworker } from "./adapter/ai-chat-moltworker";
import { D1GameSessionRepository } from "./repositories/d1/game-session-repository";
import { NgWordCache } from "./repositories/ng-word-cache";

const repo = new D1GameSessionRepository();
const ngWordCache: NgWordCachePort = new NgWordCache();

const aiClient = new AiChatMoltworker(env.OPENCLAW_API_BASE_URL, env.OPENCLAW_API_KEY);

export const gameSessionUseCase = new GameSessionUseCase(repo, aiClient, ngWordCache);
