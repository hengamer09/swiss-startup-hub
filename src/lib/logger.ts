type LogContext = Record<string, unknown>;

function fmt(level: string, message: string, context?: LogContext): string {
  return JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...context });
}

export const logger = {
  info(message: string, context?: LogContext) { console.log(fmt("info", message, context)); },
  warn(message: string, context?: LogContext) { console.warn(fmt("warn", message, context)); },
  error(message: string, context?: LogContext) { console.error(fmt("error", message, context)); },
};
