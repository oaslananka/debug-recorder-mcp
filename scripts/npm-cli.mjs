import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

export function resolveNpmCli(environment = process.env) {
  const configured = environment.npm_execpath;

  if (!configured || !isAbsolute(configured)) {
    throw new Error('npm_execpath must be an absolute path');
  }

  if (!existsSync(configured)) {
    throw new Error(`npm_execpath does not exist: ${configured}`);
  }

  return realpathSync(configured);
}

export function spawnNpmSync(args, options = {}) {
  return spawnSync(process.execPath, [resolveNpmCli(), ...args], options);
}

export function execNpmSync(args, options = {}) {
  return execFileSync(process.execPath, [resolveNpmCli(), ...args], options);
}
