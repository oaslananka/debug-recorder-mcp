import type { CallExpression, NewExpression } from 'oxc-parser';
import type { WalkState } from './walk.ts';
export declare function handleCallExpression(node: CallExpression, s: WalkState): void;
export declare function handleNewExpression(node: NewExpression, s: WalkState): void;
