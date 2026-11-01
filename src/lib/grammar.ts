import type { Parts } from '../types';

/**
 * Convenções de escrita das entradas (também valem para temas personalizados):
 *  - substantivos levam artigo definido: "o dragão", "a bruxa", "os gnomos";
 *  - adjetivos podem trazer a forma feminina depois de "|": "velho|velha".
 */

interface Noun {
  art: 'o' | 'a' | 'os' | 'as' | null;
  rest: string;
  fem: boolean;
  plural: boolean;
}

const INDEFINITE = { o: 'um', a: 'uma', os: 'uns', as: 'umas' } as const;

export function parseNoun(raw: string): Noun {
  const m = /^(os|as|o|a)\s+(.+)$/i.exec(raw.trim());
  if (!m) return { art: null, rest: raw.trim(), fem: false, plural: false };
  const art = (m[1] as string).toLowerCase() as 'o' | 'a' | 'os' | 'as';
  return { art, rest: m[2] as string, fem: art === 'a' || art === 'as', plural: art === 'os' || art === 'as' };
}

export function indefinite(raw: string): string {
  const n = parseNoun(raw);
  return n.art ? `${INDEFINITE[n.art]} ${n.rest}` : n.rest;
}

function pluralize(w: string): string {
  if (/ão$/.test(w)) return w.replace(/ão$/, 'ões');
  if (/m$/.test(w)) return w.replace(/m$/, 'ns');
  if (/il$/.test(w)) return w.replace(/il$/, 'is');
  if (/l$/.test(w)) return w.replace(/l$/, 'is');
  if (/[rz]$/.test(w)) return `${w}es`;
  if (/s$/.test(w)) return w;
  return `${w}s`;
}

export function agree(adj: string, fem: boolean, plural: boolean): string {
  const [m, f] = adj.split('|').map((s) => s.trim());
  let w = fem && f ? f : (m as string);
  if (plural) w = pluralize(w);
  return w;
}

/** Ações podem trazer formas "visto|vista": escolhe pela concordância com o sujeito. */
export function agreeInline(text: string, fem: boolean, plural: boolean): string {
  return text.replace(/([\p{L}-]+)\|([\p{L}-]+)/gu, (_m, a: string, b: string) => {
    const w = fem ? b : a;
    return plural ? pluralize(w) : w;
  });
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Monta a frase final a partir das partes sorteadas. */
export function compose(parts: Parts): string {
  const subject = parts.subject?.text;
  const subjNoun = subject ? parseNoun(subject) : null;
  const action = parts.action ? agreeInline(parts.action.text, subjNoun?.fem ?? false, subjNoun?.plural ?? false) : undefined;
  const prop = parts.prop?.text;
  const setting = parts.setting?.text;

  let out = '';
  if (subject) {
    const n = parseNoun(subject);
    out = indefinite(subject);
    if (parts.adjective) out += ` ${agree(parts.adjective.text, n.fem, n.plural)}`;
  }
  if (action) out += `${out ? ' ' : ''}${action}`;
  if (prop) out += `${out ? ', ' : ''}${prop}`;
  if (setting) out += `${out ? (prop ? ', ' : ' ') : ''}${setting}`;
  out = out.trim();
  if (!out) return '';
  return `${capitalize(out)}.`;
}
