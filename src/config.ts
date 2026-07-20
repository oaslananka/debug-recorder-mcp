export type RuntimeConfig = {
  redactBeforeStore: boolean;
  remoteHttp: boolean;
};

const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

export function parseBooleanEnv(
  name: string,
  value: string | undefined
): boolean {
  if (value === undefined) {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(`Invalid ${name}: expected true/false, 1/0, or yes/no`);
}

export function resolveRuntimeConfig(
  env: Record<string, string | undefined> = process.env
): RuntimeConfig {
  return {
    redactBeforeStore: parseBooleanEnv(
      'DEBUG_RECORDER_REDACT_BEFORE_STORE',
      env.DEBUG_RECORDER_REDACT_BEFORE_STORE
    ),
    remoteHttp: parseBooleanEnv(
      'DEBUG_RECORDER_REMOTE_HTTP',
      env.DEBUG_RECORDER_REMOTE_HTTP
    )
  };
}
