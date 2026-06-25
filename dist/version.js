import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');
export const VERSION = pkg.version;
export const NAME = pkg.name;
export function getVersion() {
    return VERSION;
}
//# sourceMappingURL=version.js.map