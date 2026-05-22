import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string; name: string };

export const VERSION = pkg.version;
export const NAME = pkg.name;

export function getVersion(): string {
  return VERSION;
}
