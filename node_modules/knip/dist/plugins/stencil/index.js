import { toConfig, toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { collectPropertyValues } from '../../typescript/ast-helpers.js';
const title = 'Stencil';
const enablers = ['@stencil/core'];
const isEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const config = ['stencil.config.{ts,js}'];
const production = ['src/**/*.tsx'];
const resolveFromAST = program => {
    const inputs = [];
    const srcDirs = collectPropertyValues(program, 'srcDir');
    const srcDir = srcDirs.size > 0 ? [...srcDirs][0] : 'src';
    inputs.push(toProductionEntry(`${srcDir}/**/*.tsx`));
    for (const script of collectPropertyValues(program, 'globalScript')) {
        inputs.push(toProductionEntry(script));
    }
    for (const tsconfig of collectPropertyValues(program, 'tsconfig')) {
        inputs.push(toConfig('typescript', tsconfig));
    }
    return inputs;
};
const plugin = {
    title,
    enablers,
    isEnabled,
    config,
    production,
    resolveFromAST,
};
export default plugin;
