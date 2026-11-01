import { Link } from 'react-router-dom';
import Heatmap from '../components/Heatmap';
import { cssVars } from '../lib/css';
import { dayKey } from '../lib/dates';
import { ACHIEVEMENTS, computeStreaks } from '../lib/stats';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/store';

export default function Progress() {
  usePageTitle('Progresso');
  const store = useStore();
  const { data } = store;
  const { stats } = data;
  const streak = computeStreaks(stats.days);
  const today = stats.days[dayKey()] ?? 0;
  const activeDays = Object.values(stats.days).filter((n) => n > 0).length;

  const byTheme = Object.entries(stats.byTheme)
    .map(([id, n]) => ({ id, n, theme: store.themeById(id) }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const maxTheme = byTheme[0]?.n ?? 1;

  const unlocked = ACHIEVEMENTS.filter((a) => a.done(data, streak));

  const tiles: { v: string; l: string }[] = [
    { v: String(streak.current), l: streak.current === 1 ? 'dia seguido' : 'dias seguidos' },
    { v: String(streak.best), l: 'melhor sequência' },
    { v: String(stats.drawn), l: 'ideias desenhadas' },
    { v: stats.generated.toLocaleString('pt-BR'), l: 'ideias geradas' },
    { v: String(stats.sessions), l: 'sessões cronometradas' },
    { v: `${Math.round(stats.minutes)} min`, l: 'tempo em sessões' },
    { v: String(stats.sketches), l: 'rabiscos baixados' },
    { v: String(activeDays), l: 'dias ativos' },
  ];

  return (
    <div className="w page">
      <div className="page-head up">
        <p className="k">// progresso</p>
        <h1>
          Seu hábito de <em>desenhar</em>
        </h1>
        <p className="lead">
          {today > 0
            ? `Hoje você já registrou ${today} ${today === 1 ? 'desenho' : 'desenhos'}. Sequência mantida ✦`
            : streak.current > 0
              ? `Você está com ${streak.current} ${streak.current === 1 ? 'dia' : 'dias'} seguidos. Registre um desenho hoje para não perder a sequência.`
              : 'Marque “Desenhei”, termine uma sessão ou baixe um rabisco para começar a sua sequência.'}
        </p>
      </div>

      <div className="tiles">
        {tiles.map((t) => (
          <div key={t.l} className="tile card">
            <b>{t.v}</b>
            <span>{t.l}</span>
          </div>
        ))}
      </div>

      <section className="block">
        <p className="k">// calendário</p>
        <h2>
          Últimas <em>14 semanas</em>
        </h2>
        <Heatmap days={stats.days} />
        <p className="hint">Cada quadradinho é um dia. Desenhos marcados, sessões concluídas e rabiscos baixados contam.</p>
      </section>

      <section className="block">
        <p className="k">// temas</p>
        <h2>
          O que você mais <em>sorteia</em>
        </h2>
        {byTheme.length ? (
          <ul className="bars">
            {byTheme.map((b) => (
              <li key={b.id}>
                <span className="bar-l">
                  {b.theme?.emoji ?? '✨'} {b.theme?.name ?? b.id}
                </span>
                <span className="bar-t">
                  <span className="bar-f" style={cssVars({ '--w': `${Math.max(6, (b.n / maxTheme) * 100)}%` })} />
                </span>
                <span className="bar-n">{b.n}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            Gere algumas ideias para ver os temas favoritos. <Link to="/">Ir ao gerador</Link>
          </p>
        )}
      </section>

      <section className="block">
        <p className="k">// conquistas</p>
        <h2>
          {unlocked.length} de {ACHIEVEMENTS.length} <em>desbloqueadas</em>
        </h2>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const ok = unlocked.includes(a);
            return (
              <div key={a.id} className={`ach card${ok ? ' ok' : ''}`}>
                <span className="ach-e" aria-hidden="true">
                  {ok ? a.emoji : '🔒'}
                </span>
                <b>{a.name}</b>
                <span>{a.hint}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
