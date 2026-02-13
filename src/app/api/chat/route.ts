import { handleSendMessage, handleStartGame } from "@/interfaces/api/chat-handler";
import { handleApiError } from "@/interfaces/errors/api-error-handler";
import type { ErrorResponse } from "@/interfaces/schemas/chat";
import { chatRequestSchema, chatSuccessResponseSchema } from "@/interfaces/schemas/chat";
import { after, NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { type: "error", code: "INVALID_JSON", message: "Request body is not valid JSON" } satisfies ErrorResponse,
        { status: 400 },
      );
    }
    const body = chatRequestSchema.parse(json);

    if (body.isInit) {
      const { response, backgroundTask } = await handleStartGame(body.username, body.locale);
      if (backgroundTask) {
        after(backgroundTask);
      }
      return NextResponse.json(chatSuccessResponseSchema.parse(response));
    }

    const response = await handleSendMessage(body.sessionId, body.message, body.locale);
    return NextResponse.json(chatSuccessResponseSchema.parse(response));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
