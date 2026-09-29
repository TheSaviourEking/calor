import pino from 'pino'

const REDACTED_PATHS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'email',
  'phone',
  'creditCard',
  'cardNumber',
  'content',
  'message',
  'text',
  'body',
  '*.password',
  '*.token',
  '*.secret',
  '*.authorization',
  '*.cookie',
  '*.email',
  '*.phone',
  '*.creditCard',
  '*.cardNumber',
  '*.content',
  '*.message',
  '*.text',
  '*.body',
  'headers.cookie',
  'headers.authorization',
  'req.headers.cookie',
  'req.headers.authorization',
]

export function createServiceLogger(serviceName: string) {
  const baseLogger = pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
    redact: {
      paths: REDACTED_PATHS,
      censor: '[REDACTED]',
    },
  })

  return {
    ...baseLogger,
    info: baseLogger.info.bind(baseLogger),
    warn: baseLogger.warn.bind(baseLogger),
    error: baseLogger.error.bind(baseLogger),
    debug: baseLogger.debug.bind(baseLogger),
    /**
     * Log a discrete service action/act with automatic PII redaction
     */
    act(action: string, meta: Record<string, any> = {}, message?: string) {
      baseLogger.info({ act: action, ...meta }, message || `[act] ${action}`)
    },
  }
}
