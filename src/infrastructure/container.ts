import { env } from "@/env";
import { GameSessionUseCase } from "@/usecase/chat";
import { AiChatMoltworker } from "./adapter/ai-chat-moltworker";
import { GameSessionRepositoryImpl } from "./repositories/game-session";

const repo = new GameSessionRepositoryImpl();

const aiClient = new AiChatMoltworker(env.OPENCLAW_API_BASE_URL, env.OPENCLAW_API_KEY);

export const gameSessionUseCase = new GameSessionUseCase(repo, aiClient);
