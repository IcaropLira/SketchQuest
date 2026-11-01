import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BUILTIN_THEMES, DEFAULT_THEME_IDS } from '../data/themes';
import { dayKey } from '../lib/dates';
import { uid } from '../lib/rng';
import type { AppData, Favorite, Prompt, Settings, ThemeData } from '../types';

const KEY = 'hiraku-sketchquest:v1';
const HISTORY_MAX = 60;

export const DEFAULT_SETTINGS: Settings = {
  themeIds: DEFAULT_THEME_IDS,
  mode: 'misto',
  detail: 'normal',
  twist: false,
  palette: false,
  sound: true,
  customParts: ['subject', 'action', 'setting'],
  genericWords: 'pouco',
  premadeShare: 50,
  avoidRepeats: true,
  paletteSize: 5,
  paletteHarmony: 'qualquer',
  batchSize: 5,
  autoOnThemeChange: false,
};

const DEFAULT_DATA: AppData = {
  settings: DEFAULT_SETTINGS,
  favorites: [],
  history: [],
  customThemes: [],
  stats: { generated: 0, drawn: 0, sessions: 0, minutes: 0, sketches: 0, days: {}, byTheme: {} },
};

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim()) : [];

function cleanTheme(t: Partial<ThemeData>): ThemeData | null {
  if (!t || typeof t.id !== 'string' || typeof t.name !== 'string') return null;
  return {
    id: t.id,
    name: t.name.slice(0, 40),
    emoji: typeof t.emoji === 'string' && t.emoji ? t.emoji.slice(0, 8) : '✨',
    hue: typeof t.hue === 'number' ? t.hue : 300,
    blurb: typeof t.blurb === 'string' ? t.blurb.slice(0, 140) : '',
    subjects: strings(t.subjects),
    adjectives: strings(t.adjectives),
    actions: strings(t.actions),
    settings: strings(t.settings),
    props: strings(t.props),
    premade: strings(t.premade),
    custom: true,
  };
}

export function normalize(input: unknown): AppData {
  const o = (input && typeof input === 'object' ? input : {}) as Partial<AppData>;
  const themes = Array.isArray(o.customThemes)
    ? o.customThemes.map((t) => cleanTheme(t)).filter((t): t is ThemeData => t !== null)
    : [];
  return {
    settings: { ...DEFAULT_DATA.settings, ...(o.settings ?? {}) },
    favorites: Array.isArray(o.favorites) ? o.favorites : [],
    history: Array.isArray(o.history) ? o.history.slice(0, HISTORY_MAX) : [],
    customThemes: themes,
    stats: { ...DEFAULT_DATA.stats, ...(o.stats ?? {}) },
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

interface PromptLike {
  text: string;
  themeIds: string[];
  twist?: string;
  palette?: string[];
}

export interface Store {
  data: AppData;
  themes: ThemeData[];
  themeById: (id: string) => ThemeData | undefined;
  selectedThemes: ThemeData[];
  setSettings: (patch: Partial<Settings>) => void;
  toggleTheme: (id: string) => void;
  setThemeIds: (ids: string[]) => void;
  pushPrompt: (p: Prompt, countIt?: boolean) => void;
  patchPrompt: (id: string, patch: Partial<Prompt>) => void;
  removePrompt: (id: string) => void;
  clearHistory: () => void;
  clearFavorites: () => void;
  resetStats: () => void;
  isSaved: (text: string) => boolean;
  toggleSave: (p: PromptLike) => boolean;
  updateFavorite: (id: string, patch: Partial<Favorite>) => void;
  toggleDone: (id: string) => void;
  removeFavorite: (id: string) => void;
  completePrompt: (p: PromptLike) => void;
  logDay: () => void;
  addSession: (minutes: number) => void;
  addSketch: () => void;
  saveCustomTheme: (t: ThemeData) => void;
  deleteCustomTheme: (id: string) => void;
  exportData: () => string;
  importData: (json: string) => string | null;
  resetAll: () => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* armazenamento cheio ou bloqueado */
    }
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const themes = useMemo(() => [...BUILTIN_THEMES, ...data.customThemes], [data.customThemes]);
  const themeById = useCallback((id: string) => themes.find((t) => t.id === id), [themes]);

  const selectedThemes = useMemo(() => {
    const picked = data.settings.themeIds.map((id) => themes.find((t) => t.id === id)).filter((t): t is ThemeData => !!t);
    return picked.length ? picked : [BUILTIN_THEMES[0] as ThemeData];
  }, [data.settings.themeIds, themes]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const value = useMemo<Store>(
    () => ({
      data,
      themes,
      themeById,
      selectedThemes,
      toastMsg,
      toast,

      setSettings: (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      toggleTheme: (id) =>
        update((d) => {
          const has = d.settings.themeIds.includes(id);
          const ids = has ? d.settings.themeIds.filter((x) => x !== id) : [...d.settings.themeIds, id];
          return { ...d, settings: { ...d.settings, themeIds: ids.length ? ids : d.settings.themeIds } };
        }),

      setThemeIds: (ids) => update((d) => ({ ...d, settings: { ...d.settings, themeIds: ids.length ? ids : d.settings.themeIds } })),

      pushPrompt: (p, countIt = true) =>
        update((d) => {
          const byTheme = { ...d.stats.byTheme };
          if (countIt) for (const id of p.themeIds) byTheme[id] = (byTheme[id] ?? 0) + 1;
          return {
            ...d,
            history: [p, ...d.history].slice(0, HISTORY_MAX),
            stats: { ...d.stats, generated: d.stats.generated + (countIt ? 1 : 0), byTheme },
          };
        }),

      patchPrompt: (id, patch) => update((d) => ({ ...d, history: d.history.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),

      removePrompt: (id) => update((d) => ({ ...d, history: d.history.filter((h) => h.id !== id) })),

      clearHistory: () => update((d) => ({ ...d, history: [] })),

      clearFavorites: () => update((d) => ({ ...d, favorites: [] })),

      resetStats: () => update((d) => ({ ...d, stats: DEFAULT_DATA.stats })),

      isSaved: (text) => data.favorites.some((f) => f.text === text),

      toggleSave: (p) => {
        const saved = dataRef.current.favorites.some((f) => f.text === p.text);
        update((d) => {
          if (saved) return { ...d, favorites: d.favorites.filter((f) => f.text !== p.text) };
          const fav: Favorite = {
            id: uid(),
            text: p.text,
            themeIds: p.themeIds,
            twist: p.twist,
            palette: p.palette,
            savedAt: Date.now(),
            done: false,
          };
          return { ...d, favorites: [fav, ...d.favorites] };
        });
        return !saved;
      },

      updateFavorite: (id, patch) => update((d) => ({ ...d, favorites: d.favorites.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),

      toggleDone: (id) =>
        update((d) => {
          const f = d.favorites.find((x) => x.id === id);
          if (!f) return d;
          const nowDone = !f.done;
          const key = dayKey();
          const stats = nowDone
            ? { ...d.stats, drawn: d.stats.drawn + 1, days: { ...d.stats.days, [key]: (d.stats.days[key] ?? 0) + 1 } }
            : { ...d.stats, drawn: Math.max(0, d.stats.drawn - 1) };
          return {
            ...d,
            favorites: d.favorites.map((x) => (x.id === id ? { ...x, done: nowDone, doneAt: nowDone ? Date.now() : undefined } : x)),
            stats,
          };
        }),

      removeFavorite: (id) => update((d) => ({ ...d, favorites: d.favorites.filter((f) => f.id !== id) })),

      completePrompt: (p) =>
        update((d) => {
          const existing = d.favorites.find((f) => f.text === p.text);
          let favorites = d.favorites;
          let newlyDone = false;
          if (existing) {
            if (!existing.done) {
              newlyDone = true;
              favorites = d.favorites.map((f) => (f.id === existing.id ? { ...f, done: true, doneAt: Date.now() } : f));
            }
          } else {
            newlyDone = true;
            favorites = [
              {
                id: uid(),
                text: p.text,
                themeIds: p.themeIds,
                twist: p.twist,
                palette: p.palette,
                savedAt: Date.now(),
                done: true,
                doneAt: Date.now(),
              },
              ...d.favorites,
            ];
          }
          const key = dayKey();
          return {
            ...d,
            favorites,
            stats: { ...d.stats, drawn: d.stats.drawn + (newlyDone ? 1 : 0), days: { ...d.stats.days, [key]: (d.stats.days[key] ?? 0) + 1 } },
          };
        }),

      logDay: () =>
        update((d) => {
          const key = dayKey();
          return { ...d, stats: { ...d.stats, days: { ...d.stats.days, [key]: (d.stats.days[key] ?? 0) + 1 } } };
        }),

      addSession: (minutes) =>
        update((d) => ({ ...d, stats: { ...d.stats, sessions: d.stats.sessions + 1, minutes: d.stats.minutes + Math.max(0, Math.round(minutes)) } })),

      addSketch: () => update((d) => ({ ...d, stats: { ...d.stats, sketches: d.stats.sketches + 1 } })),

      saveCustomTheme: (t) =>
        update((d) => {
          const exists = d.customThemes.some((x) => x.id === t.id);
          const customThemes = exists ? d.customThemes.map((x) => (x.id === t.id ? t : x)) : [...d.customThemes, t];
          return { ...d, customThemes };
        }),

      deleteCustomTheme: (id) =>
        update((d) => {
          const ids = d.settings.themeIds.filter((x) => x !== id);
          return {
            ...d,
            customThemes: d.customThemes.filter((t) => t.id !== id),
            settings: { ...d.settings, themeIds: ids.length ? ids : DEFAULT_THEME_IDS },
          };
        }),

      exportData: () => JSON.stringify({ app: 'hiraku-sketchquest', version: 1, exportedAt: new Date().toISOString(), ...dataRef.current }, null, 2),

      importData: (json) => {
        try {
          const parsed: unknown = JSON.parse(json);
          if (!parsed || typeof parsed !== 'object') return 'Arquivo inválido.';
          setData(normalize(parsed));
          return null;
        } catch {
          return 'Não consegui ler esse arquivo. Ele é um JSON exportado pelo SketchQuest?';
        }
      },

      resetAll: () => setData(DEFAULT_DATA),
    }),
    [data, themes, themeById, selectedThemes, toastMsg, toast, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}
