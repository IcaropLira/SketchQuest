import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaletteStrip from '../components/PaletteStrip';
import { copyText } from '../lib/share';
import { HARMONIES, makePalette, type Harmony } from '../lib/palette';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/store';

const COUNTS = [3, 4, 5, 6, 7, 8];

export default function Palettes() {
  usePageTitle('Paletas');
  const { toast } = useStore();
  const navigate = useNavigate();

  const [harmony, setHarmony] = useState<Harmony | 'qualquer'>('qualquer');
  const [count, setCount] = useState(5);
  const [palette, setPalette] = useState<string[]>(() => makePalette(5));
  const [locked, setLocked] = useState<boolean[]>([]);
  const [recent, setRecent] = useState<string[][]>([]);

  const gen = (n = count) => {
    const keep = Array.from({ length: n }, (_, i) => (locked[i] && palette[i] ? (palette[i] as string) : null));
    const next = makePalette(n, harmony === 'qualquer' ? undefined : harmony, Math.random, keep);
    setRecent((r) => [palette, ...r].slice(0, 8));
    setPalette(next);
  };

  const changeCount = (n: number) => {
    setCount(n);
    gen(n);
  };

  const toggleLock = (i: number) =>
    setLocked((l) => {
      const c = l.slice();
      c[i] = !c[i];
      return c;
    });

  const copyHex = async () => toast((await copyText(palette.map((c) => c.toUpperCase()).join(', '))) ? 'Códigos HEX copiados' : 'Não consegui copiar');
  const copyCss = async () =>
    toast(
      (await copyText(`:root {\n${palette.map((c, i) => `  --cor-${i + 1}: ${c};`).join('\n')}\n}`)) ? 'Variáveis CSS copiadas' : 'Não consegui copiar',
    );

  const gradient = `linear-gradient(90deg, ${palette.join(', ')})`;

  return (
    <div className="w page">
      <div className="page-head up">
        <p className="k">// paletas</p>
        <h1>
          Cores para <em>começar</em>
        </h1>
        <p className="lead">
          Gere combinações harmônicas, trave as cores que gostou e sorteie o resto. Clique numa cor para copiar o código.
        </p>
      </div>

      <div className="card form-card">
        <div className="field">
          <span className="field-l">Harmonia</span>
          <div className="chips" role="radiogroup" aria-label="Harmonia">
            <button type="button" role="radio" aria-checked={harmony === 'qualquer'} className={`chip${harmony === 'qualquer' ? ' on' : ''}`} onClick={() => setHarmony('qualquer')}>
              🎲 Surpreenda-me
            </button>
            {HARMONIES.map((h) => (
              <button key={h.id} type="button" role="radio" aria-checked={harmony === h.id} className={`chip${harmony === h.id ? ' on' : ''}`} onClick={() => setHarmony(h.id)}>
                {h.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field-l">Quantidade de cores</span>
          <div className="chips" role="radiogroup" aria-label="Quantidade de cores">
            {COUNTS.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={count === n} className={`chip${count === n ? ' on' : ''}`} onClick={() => changeCount(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pal-stage">
        <PaletteStrip colors={palette} size="lg" locked={locked} onToggleLock={toggleLock} />
        <div className="grad-bar" style={{ background: gradient }} aria-hidden="true" />
        <div className="actions">
          <button type="button" className="btn p big" onClick={() => gen()}>
            🎲 Gerar paleta
          </button>
          <button type="button" className="btn" onClick={copyHex}>
            Copiar HEX
          </button>
          <button type="button" className="btn" onClick={copyCss}>
            Copiar CSS
          </button>
          <button type="button" className="btn" onClick={() => navigate('/rabiscar', { state: { palette } })}>
            ✎ Rabiscar com esta paleta
          </button>
        </div>
      </div>

      {recent.length ? (
        <section className="block">
          <p className="k">// anteriores</p>
          <div className="recent-pals">
            {recent.map((p, i) => (
              <button
                key={`${p.join('')}-${i}`}
                type="button"
                className="rp"
                onClick={() => {
                  setPalette(p);
                  setCount(p.length);
                  setLocked([]);
                }}
                aria-label="Voltar a esta paleta"
              >
                {p.map((c, j) => (
                  <span key={`${c}-${j}`} style={{ background: c }} />
                ))}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
