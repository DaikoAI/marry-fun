/**
 * Define log levels
 * Can be controlled by environment variable LOG_LEVEL
 * Examples: LOG_LEVEL=DEBUG, LOG_LEVEL=INFO, LOG_LEVEL=WARN, LOG_LEVEL=ERROR
 *
 * Priority: ERROR > WARN > INFO > DEBUG > LOG
 * Only logs at or above the set level will be output
 */
enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
  LOG = "LOG",
}

// Define log level priority (lower number = higher priority)
const LOG_LEVEL_PRIORITY = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.LOG]: 2,
  [LogLevel.INFO]: 3,
  [LogLevel.DEBUG]: 4,
} as const;

const getTimestamp = () => {
  return new Date().toISOString();
};

const getCurrentLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();

  if (envLevel && Object.values(LogLevel).includes(envLevel as LogLevel)) {
    return envLevel as LogLevel;
  }

  // Default is INFO
  return LogLevel.INFO;
};

// Check if a log at the specified level should be output
const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = getCurrentLogLevel();
  return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[currentLevel];
};

const colorize = (message: string, level: LogLevel): string => {
  const colors = {
    [LogLevel.ERROR]: "\x1B[31m", // Red
    [LogLevel.WARN]: "\x1B[33m", // Yellow
    [LogLevel.INFO]: "\x1B[36m", // Cyan
    [LogLevel.DEBUG]: "\x1B[32m", // Green
    [LogLevel.LOG]: null, // No color (standard)
  };

  const reset = "\x1B[0m";
  const color = colors[level];

  if (color === null) {
    return message; // No color for LOG
  }

  return `${color}${message}${reset}`;
};

const formatHeader = (level: LogLevel): string => {
  const timestamp = `[${getTimestamp()}]`;
  const levelTag = `[${level}]`;
  return colorize(`${timestamp} ${levelTag}`, level);
};

export const logger = {
  log: (...args: unknown[]) => {
    if (!shouldLog(LogLevel.LOG)) return;
    const header = formatHeader(LogLevel.LOG);
    console.log(header, ...args);
  },
  info: (...args: unknown[]) => {
    if (!shouldLog(LogLevel.INFO)) return;
    const header = formatHeader(LogLevel.INFO);
    console.info(header, ...args);
  },
  debug: (...args: unknown[]) => {
    if (!shouldLog(LogLevel.DEBUG)) return;
    const header = formatHeader(LogLevel.DEBUG);
    console.log(header, ...args);
  },
  warn: (...args: unknown[]) => {
    if (!shouldLog(LogLevel.WARN)) return;
    const header = formatHeader(LogLevel.WARN);
    console.warn(header, ...args);
  },
  error: (...args: unknown[]) => {
    if (!shouldLog(LogLevel.ERROR)) return;
    const header = formatHeader(LogLevel.ERROR);
    console.error(header, ...args);
  },
  /**
   * Get the currently set log level
   */
  getCurrentLevel: (): LogLevel => getCurrentLogLevel(),
  /**
   * Get list of available log levels
   */
  getLevels: () => Object.values(LogLevel),
};

export { LogLevel };
