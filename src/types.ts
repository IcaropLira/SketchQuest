import type { Harmony } from './lib/palette';

export type PartKey = 'subject' | 'adjective' | 'action' | 'setting' | 'prop';

export const PART_KEYS: PartKey[] = ['subject', 'adjective', 'action', 'prop', 'setting'];

export const PART_LABEL: Record<PartKey, string> = {
  subject: 'Quem',
  adjective: 'Como',
  action: 'Fazendo',
  prop: 'Detalhe',
  setting: 'Onde',
};

export interface ThemeData {
  id: string;
  name: string;
  emoji: string;
  hue: number;
  blurb: string;
  subjects: string[];
  adjectives: string[];
  actions: string[];
  settings: string[];
  props: string[];
  premade: string[];
  custom?: boolean;
  /** não mistura adjetivos/ações/detalhes genéricos (úteis só para personagens) */
  noGlobal?: boolean;
}

export interface Part {
  text: string;
  themeId: string;
}

export type Parts = Partial<Record<PartKey, Part>>;

export type PromptKind = 'aleatoria' | 'pronta' | 'compartilhada';

export interface Prompt {
  id: string;
  createdAt: number;
  kind: PromptKind;
  themeIds: string[];
  parts: Parts;
  text: string;
  twist?: string;
  palette?: string[];
}

export interface Favorite {
  id: string;
  text: string;
  themeIds: string[];
  twist?: string;
  palette?: string[];
  savedAt: number;
  done: boolean;
  doneAt?: number;
  note?: string;
  rating?: number;
}

export type Mode = 'aleatoria' | 'pronta' | 'misto';
export type Detail = 'simples' | 'normal' | 'rico' | 'personalizado';
export type Generic = 'nunca' | 'pouco' | 'muito';

export interface Settings {
  themeIds: string[];
  mode: Mode;
  detail: Detail;
  twist: boolean;
  palette: boolean;
  sound: boolean;
  /** partes usadas quando detail = 'personalizado' */
  customParts: PartKey[];
  /** quanto misturar adjetivos/ações/detalhes genéricos com os do tema */
  genericWords: Generic;
  /** % de frases prontas no modo misto */
  premadeShare: number;
  avoidRepeats: boolean;
  paletteSize: number;
  paletteHarmony: Harmony | 'qualquer';
  batchSize: number;
  autoOnThemeChange: boolean;
}

export interface Stats {
  generated: number;
  drawn: number;
  sessions: number;
  minutes: number;
  sketches: number;
  days: Record<string, number>;
  byTheme: Record<string, number>;
}

export interface AppData {
  settings: Settings;
  favorites: Favorite[];
  history: Prompt[];
  customThemes: ThemeData[];
  stats: Stats;
}
