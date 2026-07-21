const SECRET_KEY_PATTERN = /(token|secret|password|api[_-]?key|authorization)/i;
const KEY_VALUE_PATTERN =
  /((?:token|secret|password|api[_-]?key)[^=\n:]{0,32}[=:]\s*)([^\s,\]}]+)/gi;
const AUTHORIZATION_HEADER_PATTERN =
  /(authorization[^=\n:]{0,32}[=:]\s*)(bearer\s+)?([^\s,\]}]+)/gi;
const BEARER_PATTERN = /\b(Bearer)\s+[a-z0-9._-]+\b/gi;
const BASE64_TOKEN_PATTERN = /\b[A-Za-z0-9+/]{40,}={0,2}\b/g;
const SECRET_PREFIX_PATTERN = /\bsk-[A-Za-z0-9]{16,}\b/g;
const GITHUB_TOKEN_PATTERN = /\bgh[pousr]_\w{20,}\b/g;
const NPM_TOKEN_PATTERN = /\bnpm_[A-Za-z0-9]{20,}\b/g;
const SLACK_TOKEN_PATTERN = /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/g;
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogMetadata = Record<string, unknown>;

function getConfiguredLogLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL?.toLowerCase();

  if (
    configured === 'debug' ||
    configured === 'info' ||
    configured === 'warn' ||
    configured === 'error'
  ) {
    return configured;
  }

  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return (
    LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[getConfiguredLogLevel()]
  );
}

function redactString(value: string): string {
  return value
    .replace(
      AUTHORIZATION_HEADER_PATTERN,
      (_match, prefix: string, scheme?: string) => {
        const normalizedScheme = scheme ? `${scheme.trim()} ` : '';
        return `${prefix}${normalizedScheme}[REDACTED]`;
      }
    )
    .replace(KEY_VALUE_PATTERN, '$1[REDACTED]')
    .replace(BEARER_PATTERN, '$1 [REDACTED]')
    .replace(BASE64_TOKEN_PATTERN, '[REDACTED]')
    .replace(SECRET_PREFIX_PATTERN, '[REDACTED]')
    .replace(GITHUB_TOKEN_PATTERN, '[REDACTED]')
    .replace(NPM_TOKEN_PATTERN, '[REDACTED]')
    .replace(SLACK_TOKEN_PATTERN, '[REDACTED]');
}

export function redactSecrets(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }

  if (value && typeof value === 'object') {
    const redactedEntries = Object.entries(
      value as Record<string, unknown>
    ).map(([key, entryValue]) => {
      if (SECRET_KEY_PATTERN.test(key)) {
        return [key, '[REDACTED]'];
      }

      return [key, redactSecrets(entryValue)];
    });

    return Object.fromEntries(redactedEntries);
  }

  return value;
}

export function redact(value: unknown): unknown {
  return redactSecrets(value);
}

export function log(
  level: LogLevel,
  message: string,
  metadata?: LogMetadata
): void {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message: redactString(message),
    metadata: metadata ? redactSecrets(metadata) : undefined
  };

  const line = JSON.stringify(payload);

  process.stderr.write(`${line}\n`);
}
