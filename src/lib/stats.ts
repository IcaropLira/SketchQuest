import type { AppData } from '../types';
import { addDays, dayKey } from './dates';

export function computeStreaks(days: Record<string, number>): { current: number; best: number } {
  const keys = Object.keys(days).filter((k) => (days[k] ?? 0) > 0).sort();
  if (keys.length === 0) return { current: 0, best: 0 };

  // melhor sequência
  let best = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(`${keys[i - 1]}T12:00:00`);
    const cur = new Date(`${keys[i]}T12:00:00`);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    run = diff === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  // sequência atual: conta a partir de hoje (ou de ontem, se hoje ainda não teve desenho)
  const today = new Date();
  let cursor = days[dayKey(today)] ? today : addDays(today, -1);
  let current = 0;
  while (days[dayKey(cursor)]) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, best };
}

export interface Achievement {
  id: string;
  name: string;
  hint: string;
  emoji: string;
  done: (d: AppData, streak: { current: number; best: number }) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', emoji: '✏️', name: 'Primeiro traço', hint: 'Marque um desenho como feito.', done: (d) => d.stats.drawn >= 1 },
  { id: 'ten', emoji: '🎯', name: 'Dez desenhos', hint: 'Desenhe 10 ideias.', done: (d) => d.stats.drawn >= 10 },
  { id: 'fifty', emoji: '🖼️', name: 'Galeria cheia', hint: 'Desenhe 50 ideias.', done: (d) => d.stats.drawn >= 50 },
  { id: 'gen100', emoji: '🎲', name: 'Fábrica de ideias', hint: 'Gere 100 ideias.', done: (d) => d.stats.generated >= 100 },
  { id: 'gen1000', emoji: '🌌', name: 'Mente borbulhante', hint: 'Gere 1.000 ideias.', done: (d) => d.stats.generated >= 1000 },
  { id: 'streak3', emoji: '🔥', name: 'Aquecendo', hint: '3 dias seguidos desenhando.', done: (_d, s) => s.best >= 3 },
  { id: 'streak7', emoji: '🗓️', name: 'Semana inteira', hint: '7 dias seguidos desenhando.', done: (_d, s) => s.best >= 7 },
  { id: 'streak30', emoji: '👑', name: 'Hábito de ferro', hint: '30 dias seguidos desenhando.', done: (_d, s) => s.best >= 30 },
  { id: 'explorer', emoji: '🧭', name: 'Explorador', hint: 'Gere ideias em 5 temas diferentes.', done: (d) => Object.keys(d.stats.byTheme).length >= 5 },
  { id: 'timer', emoji: '⏱️', name: 'Mestre do cronômetro', hint: 'Conclua 10 sessões cronometradas.', done: (d) => d.stats.sessions >= 10 },
  { id: 'sketch', emoji: '🎨', name: 'Rabiscador', hint: 'Baixe 5 rabiscos do quadro.', done: (d) => d.stats.sketches >= 5 },
  { id: 'maker', emoji: '🛠️', name: 'Criador de mundos', hint: 'Crie um tema próprio.', done: (d) => d.customThemes.length >= 1 },
];
