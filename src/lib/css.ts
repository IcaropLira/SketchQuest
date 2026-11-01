import type { CSSProperties } from 'react';

/** Permite passar variáveis CSS (--x) no atributo style sem brigar com o TypeScript. */
export const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as CSSProperties;
