import { spawn } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const suiteArg = rawArgs.find((arg) => arg.startsWith('--suite='));
const suite = suiteArg?.split('=')[1] ?? 'unit';
const passthroughArgs = rawArgs.filter((arg) => !arg.startsWith('--suite='));

const child = spawn(
  process.execPath,
  [
    '--experimental-vm-modules',
    './node_modules/jest/bin/jest.js',
    ...passthroughArgs
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      JEST_JUNIT_OUTPUT_DIR:
        process.env.JEST_JUNIT_OUTPUT_DIR ?? `test-results/${suite}`,
      JEST_JUNIT_OUTPUT_NAME:
        process.env.JEST_JUNIT_OUTPUT_NAME ?? 'junit.xml'
    }
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
