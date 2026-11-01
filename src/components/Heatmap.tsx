import { addDays, dayKey } from '../lib/dates';

interface Props {
  days: Record<string, number>;
  weeks?: number;
}

/** Calendário de atividade, no estilo "contribuições" (colunas = semanas). */
export default function Heatmap({ days, weeks = 14 }: Props) {
  const today = new Date();
  const start = addDays(today, -((weeks - 1) * 7 + today.getDay()));
  const cells: { key: string; n: number; future: boolean }[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i);
    const key = dayKey(d);
    cells.push({ key, n: days[key] ?? 0, future: d > today });
  }
  const level = (n: number) => (n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4);

  return (
    <div className="heat" role="img" aria-label="Calendário de dias em que você desenhou">
      {cells.map((c) => (
        <span
          key={c.key}
          className={`hc l${level(c.n)}${c.future ? ' fut' : ''}`}
          title={c.future ? '' : `${c.key.split('-').reverse().join('/')}: ${c.n} registro(s)`}
        />
      ))}
    </div>
  );
}
