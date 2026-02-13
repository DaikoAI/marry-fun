import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("logger (logger.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("LOG_LEVEL未設定時はINFO以上のみ出力する", async () => {
    vi.unstubAllEnvs();

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const { logger } = await import("@/utils/logger");

    logger.debug("debug message");
    logger.log("log message");
    logger.info("info message");

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("LOG_LEVEL=WARN のとき warn/error のみ出力する", async () => {
    vi.stubEnv("LOG_LEVEL", "WARN");

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { logger } = await import("@/utils/logger");

    logger.info("info");
    logger.warn("warn");
    logger.error("error");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("不正なLOG_LEVELはINFOとして扱う", async () => {
    vi.stubEnv("LOG_LEVEL", "INVALID_LEVEL");

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const { logger } = await import("@/utils/logger");

    expect(logger.getCurrentLevel()).toBe("INFO");
    logger.log("log");
    logger.info("info");

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });
});
