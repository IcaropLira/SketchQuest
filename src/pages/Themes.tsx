import { Link, useNavigate } from 'react-router-dom';
import { cssVars } from '../lib/css';
import { comboCount } from '../lib/generator';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/store';

export default function Themes() {
  usePageTitle('Temas');
  const s = useStore();
  const navigate = useNavigate();
  const selected = new Set(s.data.settings.themeIds);

  return (
    <div className="w page">
      <div className="page-head up">
        <p className="k">// temas</p>
        <h1>
          {s.themes.length} temas, <em>infinitas</em> ideias
        </h1>
        <p className="lead">
          Use um tema sozinho ou misture vários: cada parte da frase (quem, como, fazendo, onde) vem de um tema sorteado entre os escolhidos.
        </p>
      </div>

      <div className="grid">
        {s.themes.map((t, i) => (
          <article
            key={t.id}
            className={`card theme${selected.has(t.id) ? ' sel' : ''}`}
            style={cssVars({ '--h': t.hue, '--d': Math.min(i, 8) })}
          >
            <div className="ic">
              <span className="ini" aria-hidden="true">
                {t.emoji}
              </span>
              <span className="ic-tags">
                {t.custom ? <span className="badge">seu</span> : null}
                {selected.has(t.id) ? <span className="badge sub">ativo</span> : null}
              </span>
            </div>
            <h3>{t.name}</h3>
            <p>{t.blurb || 'Tema personalizado.'}</p>
            <div className="meta">
              <span>{t.subjects.length} quem</span>
              <span>{t.settings.length} onde</span>
              <span>{t.premade.length} prontas</span>
            </div>
            <div className="meta">
              <span>≈ {comboCount(t).toLocaleString('pt-BR')} combinações</span>
            </div>
            <div className="btns">
              <button
                type="button"
                className="btn p sm"
                onClick={() => {
                  s.setThemeIds([t.id]);
                  navigate('/');
                }}
              >
                Usar só este
              </button>
              <button type="button" className="btn sm" onClick={() => s.toggleTheme(t.id)} aria-pressed={selected.has(t.id)}>
                {selected.has(t.id) ? 'Tirar da mistura' : '+ Misturar'}
              </button>
            </div>
          </article>
        ))}

        <article className="card theme add">
          <div className="ic">
            <span className="ini" aria-hidden="true">
              ＋
            </span>
          </div>
          <h3>Crie o seu</h3>
          <p>Monte um tema com as suas próprias palavras, personagens e frases prontas.</p>
          <div className="btns">
            <Link className="btn p sm" to="/meus-temas">
              Criar tema
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
