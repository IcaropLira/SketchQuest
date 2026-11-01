import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PaletteStrip from '../components/PaletteStrip';
import { formatDate } from '../lib/dates';
import { copyText, downloadText } from '../lib/share';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/store';
import type { Favorite, Prompt } from '../types';

type Filter = 'todas' | 'fazer' | 'feitas';

export default function Saved() {
  usePageTitle('Salvos');
  const store = useStore();
  const navigate = useNavigate();
  const { favorites } = store.data;

  const [filter, setFilter] = useState<Filter>('todas');
  const [themeId, setThemeId] = useState('todos');
  const [query, setQuery] = useState('');
  const [openNote, setOpenNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const usedThemes = useMemo(() => {
    const ids = new Set(favorites.flatMap((f) => f.themeIds));
    return store.themes.filter((t) => ids.has(t.id));
  }, [favorites, store.themes]);

  const list = favorites.filter((f) => {
    if (filter === 'fazer' && f.done) return false;
    if (filter === 'feitas' && !f.done) return false;
    if (themeId !== 'todos' && !f.themeIds.includes(themeId)) return false;
    if (query && !`${f.text} ${f.note ?? ''} ${f.twist ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const toPrompt = (f: Favorite): Prompt => ({
    id: f.id,
    createdAt: f.savedAt,
    kind: 'pronta',
    themeIds: f.themeIds,
    parts: {},
    text: f.text,
    twist: f.twist,
    palette: f.palette,
  });

  const copyAll = async () => {
    const text = list.map((f) => `${f.done ? '[x]' : '[ ]'} ${f.text}${f.twist ? ` (desafio: ${f.twist})` : ''}`).join('\n');
    store.toast((await copyText(text)) ? 'Lista copiada' : 'Não consegui copiar');
  };

  const exportTxt = () => {
    const text = list.map((f) => `${f.done ? '[x]' : '[ ]'} ${f.text}${f.twist ? `\n    desafio: ${f.twist}` : ''}${f.note ? `\n    nota: ${f.note}` : ''}`).join('\n\n');
    downloadText('sketchquest-ideias.txt', text || 'Nenhuma ideia salva ainda.');
  };

  const exportJson = () => {
    downloadText('sketchquest-backup.json', store.exportData(), 'application/json');
    store.toast('Backup baixado');
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const err = store.importData(text);
    store.toast(err ?? 'Backup restaurado ✦');
    if (fileRef.current) fileRef.current.value = '';
  };

  const clearHist = () => {
    if (!store.data.history.length) return store.toast('O histórico já está vazio');
    if (window.confirm(`Apagar as ${store.data.history.length} ideias do histórico? Os favoritos continuam.`)) {
      store.clearHistory();
      store.toast('Histórico apagado');
    }
  };

  const clearFavs = () => {
    if (!favorites.length) return store.toast('Você não tem favoritos');
    if (window.confirm(`Apagar os ${favorites.length} favoritos (com notas e estrelas)? Isso não dá para desfazer.`)) {
      store.clearFavorites();
      store.toast('Favoritos apagados');
    }
  };

  const clearStats = () => {
    if (window.confirm('Zerar estatísticas, sequência de dias e conquistas?')) {
      store.resetStats();
      store.toast('Estatísticas zeradas');
    }
  };

  const wipe = () => {
    if (window.confirm('Apagar TUDO (histórico, favoritos, estatísticas, temas próprios e configurações)? Faça um backup antes.')) {
      store.resetAll();
      store.toast('Tudo limpo');
    }
  };

  return (
    <div className="w page">
      <div className="page-head up">
        <p className="k">// salvos</p>
        <h1>
          Suas <em>ideias</em> guardadas
        </h1>
        <p className="lead">
          {favorites.length
            ? `${favorites.length} salva${favorites.length > 1 ? 's' : ''}, ${favorites.filter((f) => f.done).length} já desenhada${favorites.filter((f) => f.done).length === 1 ? '' : 's'}.`
            : 'Ainda não há nada por aqui. Toque em ♡ numa ideia para guardá-la.'}
        </p>
      </div>

      {favorites.length ? (
        <>
          <div className="filters">
            <div className="chips" role="radiogroup" aria-label="Filtrar por situação">
              {(
                [
                  ['todas', 'Todas'],
                  ['fazer', 'Para desenhar'],
                  ['feitas', 'Desenhadas'],
                ] as [Filter, string][]
              ).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={filter === v} className={`chip${filter === v ? ' on' : ''}`} onClick={() => setFilter(v)}>
                  {l}
                </button>
              ))}
            </div>
            <div className="filters-r">
              <select value={themeId} onChange={(e) => setThemeId(e.target.value)} aria-label="Filtrar por tema">
                <option value="todos">Todos os temas</option>
                {usedThemes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.emoji} {t.name}
                  </option>
                ))}
              </select>
              <input type="search" placeholder="Buscar nas ideias e notas…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar" />
            </div>
          </div>

          {list.length === 0 ? <p className="muted">Nada encontrado com esses filtros.</p> : null}

          <ul className="saved">
            {list.map((f) => (
              <li key={f.id} className={`sv card${f.done ? ' done' : ''}`}>
                <div className="sv-top">
                  <button
                    type="button"
                    className={`check${f.done ? ' on' : ''}`}
                    onClick={() => store.toggleDone(f.id)}
                    aria-pressed={f.done}
                    aria-label={f.done ? 'Marcar como não desenhada' : 'Marcar como desenhada'}
                    title={f.done ? 'Desenhada' : 'Marcar como desenhada'}
                  >
                    {f.done ? '✓' : ''}
                  </button>
                  <div className="sv-body">
                    <p className="sv-text">{f.text}</p>
                    {f.twist ? <p className="sv-twist">Desafio: {f.twist}</p> : null}
                    {f.palette?.length ? <PaletteStrip colors={f.palette} /> : null}
                    <p className="sv-meta">
                      {f.themeIds
                        .map((id) => store.themeById(id))
                        .filter((t) => !!t)
                        .map((t) => `${t!.emoji} ${t!.name}`)
                        .join(' · ')}
                      {f.themeIds.length ? ' · ' : ''}
                      salva em {formatDate(f.savedAt)}
                      {f.done && f.doneAt ? ` · desenhada em ${formatDate(f.doneAt)}` : ''}
                    </p>
                  </div>
                </div>

                {f.done ? (
                  <div className="stars" role="radiogroup" aria-label="Nota do desenho">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={f.rating === n}
                        className={(f.rating ?? 0) >= n ? 'on' : ''}
                        onClick={() => store.updateFavorite(f.id, { rating: f.rating === n ? undefined : n })}
                        aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="hint">como ficou?</span>
                  </div>
                ) : null}

                {openNote === f.id ? (
                  <textarea
                    className="note"
                    rows={3}
                    autoFocus
                    placeholder="Anotações: o que funcionou, o que mudar, referências…"
                    defaultValue={f.note ?? ''}
                    onBlur={(e) => {
                      store.updateFavorite(f.id, { note: e.target.value.trim() || undefined });
                      setOpenNote(null);
                    }}
                  />
                ) : f.note ? (
                  <button type="button" className="note-show" onClick={() => setOpenNote(f.id)}>
                    📝 {f.note}
                  </button>
                ) : null}

                <div className="sv-act">
                  <button type="button" className="btn sm" onClick={() => navigate('/rabiscar', { state: { prompt: toPrompt(f) } })}>
                    ✎ Rabiscar
                  </button>
                  <button type="button" className="btn sm" onClick={() => setOpenNote(openNote === f.id ? null : f.id)}>
                    📝 Nota
                  </button>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={async () => store.toast((await copyText(f.text)) ? 'Copiado' : 'Não consegui copiar')}
                  >
                    Copiar
                  </button>
                  <button type="button" className="btn sm danger" onClick={() => store.removeFavorite(f.id)}>
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="btns">
            <button type="button" className="btn" onClick={copyAll}>
              Copiar lista
            </button>
            <button type="button" className="btn" onClick={exportTxt}>
              Baixar .txt
            </button>
          </div>
        </>
      ) : (
        <div className="empty card">
          <p>Seus favoritos aparecem aqui, com notas, nota de 1 a 5 e filtros.</p>
          <Link className="btn p" to="/">
            Gerar uma ideia
          </Link>
        </div>
      )}

      <section className="block">
        <p className="k">// seus dados</p>
        <h2>
          Backup e <em>privacidade</em>
        </h2>
        <p className="lead">Tudo fica salvo só neste navegador. Exporte um backup para levar para outro aparelho ou guardar com segurança.</p>
        <div className="btns">
          <button type="button" className="btn" onClick={exportJson}>
            Exportar backup (.json)
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Importar backup
          </button>
          <button type="button" className="btn danger" onClick={wipe}>
            Apagar tudo
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        </div>
        <p className="k" style={{ marginTop: 28 }}>
          // limpar por partes
        </p>
        <div className="btns" style={{ marginTop: 0 }}>
          <button type="button" className="btn danger" onClick={clearHist}>
            🗑 Histórico de ideias ({store.data.history.length})
          </button>
          <button type="button" className="btn danger" onClick={clearFavs}>
            🗑 Favoritos ({favorites.length})
          </button>
          <button type="button" className="btn danger" onClick={clearStats}>
            🗑 Estatísticas e conquistas
          </button>
        </div>
      </section>
    </div>
  );
}
