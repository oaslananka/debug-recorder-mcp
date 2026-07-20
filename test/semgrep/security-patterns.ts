declare const userInput: string;
declare function run(command: string, options?: { shell?: boolean }): void;

// ruleid: debug-recorder.no-dynamic-code-execution
eval(userInput);

// ruleid: debug-recorder.no-dynamic-code-execution
new Function(userInput);

// ok: debug-recorder.no-dynamic-code-execution
JSON.parse(userInput);

// ruleid: debug-recorder.no-shell-true
run(userInput, { shell: true });

// ok: debug-recorder.no-shell-true
run(userInput, { shell: false });

// ruleid: debug-recorder.no-log-entire-environment
console.error(process.env);

// ok: debug-recorder.no-log-entire-environment
console.info(process.env.NODE_ENV);
