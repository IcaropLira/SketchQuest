import { pick, type Rng } from './rng';

export type Harmony = 'analoga' | 'complementar' | 'triade' | 'dividida' | 'mono' | 'pastel' | 'neon' | 'terrosa';

export const HARMONIES: { id: Harmony; name: string }[] = [
  { id: 'analoga', name: 'Análoga' },
  { id: 'complementar', name: 'Complementar' },
  { id: 'triade', name: 'Tríade' },
  { id: 'dividida', name: 'Complementar dividida' },
  { id: 'mono', name: 'Monocromática' },
  { id: 'pastel', name: 'Pastel' },
  { id: 'neon', name: 'Neon' },
  { id: 'terrosa', name: 'Terrosa' },
];

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Cor de texto legível sobre um fundo hex. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0d0817' : '#ffffff';
}

function between(rng: Rng, a: number, b: number): number {
  return a + rng() * (b - a);
}

export function makePalette(count = 5, harmony?: Harmony, rng: Rng = Math.random, locked?: (string | null)[]): string[] {
  const kind = harmony ?? pick(HARMONIES, rng).id;
  const base = rng() * 360;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    let h = base;
    let s = between(rng, 0.5, 0.8);
    let l = between(rng, 0.35, 0.7);
    switch (kind) {
      case 'analoga':
        h = base + (i - (count - 1) / 2) * 28;
        break;
      case 'complementar':
        h = base + (i % 2 === 0 ? 0 : 180) + between(rng, -10, 10);
        l = 0.3 + t * 0.45;
        break;
      case 'triade':
        h = base + (i % 3) * 120 + between(rng, -8, 8);
        break;
      case 'dividida':
        h = base + [0, 150, 210][i % 3]! + between(rng, -8, 8);
        break;
      case 'mono':
        s = between(rng, 0.35, 0.7);
        l = 0.16 + t * 0.7;
        break;
      case 'pastel':
        h = base + i * (360 / count) + between(rng, -12, 12);
        s = between(rng, 0.6, 0.85);
        l = between(rng, 0.78, 0.88);
        break;
      case 'neon':
        h = base + i * (360 / count);
        s = 1;
        l = between(rng, 0.52, 0.6);
        break;
      case 'terrosa':
        h = between(rng, 8, 52);
        s = between(rng, 0.25, 0.5);
        l = 0.22 + t * 0.5;
        break;
    }
    out.push(hslToHex(h, s, l));
  }
  if (locked) {
    for (let i = 0; i < out.length; i++) {
      const keep = locked[i];
      if (keep) out[i] = keep;
    }
  }
  return out;
}
