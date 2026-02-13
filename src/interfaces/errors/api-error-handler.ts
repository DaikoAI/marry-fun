import { DomainError } from "@/domain/errors/domain-error";
import { logger } from "@/utils/logger";
import { ZodError } from "zod";
import type { ErrorResponse } from "../schemas/chat";

export function handleApiError(error: unknown): { status: number; body: ErrorResponse } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        type: "error",
        code: "VALIDATION_ERROR",
        message: error.errors.map(e => e.message).join(", "),
      },
    };
  }

  if (error instanceof DomainError) {
    return {
      status: error.statusCode,
      body: {
        type: "error",
        code: error.code,
        message: error.message,
      },
    };
  }

  logger.error("Unexpected error:", error);
  return {
    status: 500,
    body: {
      type: "error",
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  };
}
