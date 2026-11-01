import { GLOBAL_POOLS, TWISTS } from '../data/extras';
import type { Detail, Generic, Mode, Part, PartKey, Parts, Prompt, Settings, ThemeData } from '../types';
import { compose } from './grammar';
import { makePalette, type Harmony } from './palette';
import { pick, uid, type Rng } from './rng';

const POOL: Record<PartKey, 'subjects' | 'adjectives' | 'actions' | 'settings' | 'props'> = {
  subject: 'subjects',
  adjective: 'adjectives',
  action: 'actions',
  setting: 'settings',
  prop: 'props',
};

const ORDER: PartKey[] = ['subject', 'adjective', 'action', 'prop', 'setting'];

const PARTS_BY_DETAIL: Record<Exclude<Detail, 'personalizado'>, PartKey[]> = {
  simples: ['subject', 'setting'],
  normal: ['subject', 'adjective', 'action', 'setting'],
  rico: ['subject', 'adjective', 'action', 'prop', 'setting'],
};

const GENERIC_P: Record<Generic, number> = { nunca: 0, pouco: 0.25, muito: 0.6 };

export function partsFor(detail: Detail, custom?: PartKey[]): PartKey[] {
  if (detail === 'personalizado') {
    const picked = ORDER.filter((k) => custom?.includes(k));
    return picked.length ? picked : ['subject', 'setting'];
  }
  return PARTS_BY_DETAIL[detail];
}

export interface GenOptions {
  themes: ThemeData[];
  mode: Mode;
  detail: Detail;
  twist: boolean;
  palette: boolean;
  previous?: Prompt;
  locks?: Partial<Record<PartKey, boolean>>;
  rng?: Rng;
  customParts?: PartKey[];
  generic?: Generic;
  /** % de frases prontas no modo misto (0-100) */
  premadeShare?: number;
  /** textos recentes que não devem se repetir */
  avoid?: string[];
  paletteSize?: number;
  paletteHarmony?: Harmony | 'qualquer';
}

/** Monta as opções de geração a partir das configurações salvas. */
export function optionsFrom(s: Settings, themes: ThemeData[], extra: Partial<GenOptions> = {}, avoid?: string[]): GenOptions {
  return {
    themes,
    mode: s.mode,
    detail: s.detail,
    twist: s.twist,
    palette: s.palette,
    customParts: s.customParts,
    generic: s.genericWords,
    premadeShare: s.premadeShare,
    paletteSize: s.paletteSize,
    paletteHarmony: s.paletteHarmony,
    avoid: s.avoidRepeats ? avoid : undefined,
    ...extra,
  };
}

function pickPart(key: PartKey, themes: ThemeData[], rng: Rng, genericP: number, avoid?: string): Part | undefined {
  const field = POOL[key];
  const usable = themes.filter((t) => t[field].length > 0);
  const global = GLOBAL_POOLS[key];

  for (let attempt = 0; attempt < 4; attempt++) {
    const theme = usable.length ? pick(usable, rng) : undefined;
    const useGlobal = !!global && (!theme || (!theme.noGlobal && rng() < genericP));
    let part: Part | undefined;
    if (useGlobal && global) part = { text: pick(global, rng), themeId: 'global' };
    else if (theme) part = { text: pick(theme[field], rng), themeId: theme.id };
    if (part && (part.text !== avoid || attempt === 3)) return part;
  }
  return undefined;
}

function randomTwist(rng: Rng, avoid?: string): string {
  let t = pick(TWISTS, rng);
  if (avoid && t === avoid) t = pick(TWISTS, rng);
  return t;
}

function generateOnce(o: GenOptions): Prompt {
  const rng = o.rng ?? Math.random;
  const themes = o.themes;
  const genericP = GENERIC_P[o.generic ?? 'pouco'];
  const withPremade = themes.filter((t) => t.premade.length > 0);

  let kind: 'aleatoria' | 'pronta' =
    o.mode === 'misto' ? (rng() * 100 < (o.premadeShare ?? 50) ? 'pronta' : 'aleatoria') : o.mode;
  if (kind === 'pronta' && withPremade.length === 0) kind = 'aleatoria';

  let parts: Parts = {};
  let text = '';
  let usedThemeIds: string[] = themes.map((t) => t.id);

  if (kind === 'pronta') {
    const theme = pick(withPremade, rng);
    let chosen = pick(theme.premade, rng);
    if (o.previous && chosen === o.previous.text && theme.premade.length > 1) chosen = pick(theme.premade, rng);
    text = chosen;
    usedThemeIds = [theme.id];
  } else {
    const keepLocks = o.previous?.kind === 'aleatoria' ? o.locks : undefined;
    for (const key of partsFor(o.detail, o.customParts)) {
      const locked = keepLocks?.[key] ? o.previous?.parts[key] : undefined;
      const part = locked ?? pickPart(key, themes, rng, genericP, o.previous?.parts[key]?.text);
      if (part) parts[key] = part;
    }
    text = compose(parts);
    const fromParts = [...new Set(Object.values(parts).map((p) => p.themeId))].filter((id) => id !== 'global');
    if (fromParts.length) usedThemeIds = fromParts;
    if (!text) {
      const fallback = themes.find((t) => t.premade.length > 0);
      text = fallback ? pick(fallback.premade, rng) : 'Desenhe qualquer coisa que te dê vontade hoje.';
      parts = {};
      kind = 'pronta';
      usedThemeIds = fallback ? [fallback.id] : usedThemeIds;
    }
  }

  return {
    id: uid(),
    createdAt: Date.now(),
    kind,
    themeIds: usedThemeIds,
    parts,
    text,
    twist: o.twist ? randomTwist(rng, o.previous?.twist) : undefined,
    palette: o.palette ? makePalette(o.paletteSize ?? 5, o.paletteHarmony === 'qualquer' ? undefined : o.paletteHarmony, rng) : undefined,
  };
}

export function generate(o: GenOptions): Prompt {
  let p = generateOnce(o);
  const avoid = o.avoid;
  if (avoid?.length) {
    for (let i = 0; i < 8 && avoid.includes(p.text); i++) p = generateOnce(o);
  }
  return p;
}

/** Sorteia de novo apenas uma parte da frase. */
export function rerollPart(p: Prompt, key: PartKey, themes: ThemeData[], generic: Generic = 'pouco', rng: Rng = Math.random): Prompt {
  if (p.kind !== 'aleatoria') return p;
  const part = pickPart(key, themes, rng, GENERIC_P[generic], p.parts[key]?.text);
  if (!part) return p;
  const parts: Parts = { ...p.parts, [key]: part };
  return { ...p, id: uid(), createdAt: Date.now(), parts, text: compose(parts) };
}

export function newTwist(p: Prompt, rng: Rng = Math.random): Prompt {
  return { ...p, twist: randomTwist(rng, p.twist) };
}

export function newPalette(p: Prompt, size = 5, harmony: Harmony | 'qualquer' = 'qualquer', rng: Rng = Math.random): Prompt {
  return { ...p, palette: makePalette(size, harmony === 'qualquer' ? undefined : harmony, rng) };
}

/** Número aproximado de combinações possíveis de um tema (modo aleatório rico). */
export function comboCount(t: ThemeData): number {
  const n = (a: string[]) => Math.max(a.length, 1);
  return n(t.subjects) * n(t.adjectives) * n(t.actions) * n(t.props) * n(t.settings) + t.premade.length;
}
