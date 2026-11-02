import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Segmented, Switch } from '../components/Controls';
import PromptCard from '../components/PromptCard';
import Sparkle from '../components/Sparkle';
import ThemePicker from '../components/ThemePicker';
import { BUILTIN_THEMES } from '../data/themes';
import { cssVars } from '../lib/css';
import { dayKey } from '../lib/dates';
import { generate, newPalette, newTwist, optionsFrom, rerollPart } from '../lib/generator';
import { HARMONIES, type Harmony } from '../lib/palette';
import { hashString, mulberry32, pick, uid } from '../lib/rng';
import { copyText, downloadPromptCard, promptToText, sharePrompt } from '../lib/share';
import { usePageTitle } from '../lib/usePageTitle';
import { DEFAULT_SETTINGS, useStore } from '../store/store';
import { PART_KEYS, PART_LABEL, type Detail, type Generic, type Mode, type PartKey, type Prompt } from '../types';

/** Ideia do dia: igual para todo mundo que abre o site na mesma data. */
function buildDaily(key: string): Prompt {
  const rng = mulberry32(hashString(`hiraku-sketchquest-${key}`));
  const theme = pick(BUILTIN_THEMES, rng);
  const p = generate({ themes: [theme], mode: 'misto', detail: 'rico', twist: true, palette: true, rng });
  return { ...p, id: `daily-${key}`, createdAt: new Date(`${key}T12:00:00`).getTime() };
}

const MODE_OPTIONS: { value: Mode; label: string; hint: string }[] = [
  { value: 'aleatoria', label: 'Aleatória', hint: 'Monta a frase juntando palavras sorteadas' },
  { value: 'pronta', label: 'Pronta', hint: 'Frases escritas à mão' },
  { value: 'misto', label: 'Misto', hint: 'Um pouco de cada' },
];

const DETAIL_OPTIONS: { value: Detail; label: string; hint: string }[] = [
  { value: 'simples', label: 'Simples', hint: 'Quem + onde' },
  { value: 'normal', label: 'Normal', hint: 'Quem, como, fazendo, onde' },
  { value: 'rico', label: 'Rico', hint: 'Tudo, mais um detalhe' },
  { value: 'personalizado', label: 'Personalizado', hint: 'Você escolhe as partes' },
];

const GENERIC_OPTIONS: { value: Generic; label: string; hint: string }[] = [
  { value: 'nunca', label: 'Nunca', hint: 'Só palavras do próprio tema' },
  { value: 'pouco', label: 'Às vezes', hint: 'Algumas palavras genéricas, para variar' },
  { value: 'muito', label: 'Bastante', hint: 'Mais surpresa e mais absurdo' },
];

const SHARE_OPTIONS = [
  { value: '25', label: 'Poucas', hint: '25% de frases prontas' },
  { value: '50', label: 'Metade', hint: '50% de frases prontas' },
  { value: '75', label: 'Muitas', hint: '75% de frases prontas' },
];

const PALETTE_SIZES = ['3', '4', '5', '6', '7', '8'].map((v) => ({ value: v, label: v }));
const BATCH_SIZES = ['3', '5', '10'].map((v) => ({ value: v, label: v }));

export default function Generator() {
  usePageTitle();
  const store = useStore();
  const { data, selectedThemes } = store;
  const s = data.settings;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [cursor, setCursor] = useState(0);
  const [locks, setLocks] = useState<Partial<Record<PartKey, boolean>>>({});
  const [batch, setBatch] = useState<Prompt[]>([]);
  const [showOpts, setShowOpts] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const history = data.history;
  const safeCursor = Math.min(cursor, Math.max(history.length - 1, 0));
  const current: Prompt | undefined = history[safeCursor];
  const todayKey = dayKey();
  const daily = useMemo(() => buildDaily(todayKey), [todayKey]);

  const recentTexts = () => history.slice(0, 30).map((h) => h.text);

  const roll = useCallback(() => {
    const p = generate(optionsFrom(s, selectedThemes, { previous: current, locks }, history.slice(0, 30).map((h) => h.text)));
    if (p.kind !== 'aleatoria') setLocks({});
    store.pushPrompt(p);
    setCursor(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThemes, s, current, locks, history, store.pushPrompt]);

  // primeira abertura: ideia compartilhada por link (?q=) ou uma ideia nova
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const q = params.get('q');
    if (q) {
      const pal = params.get('p');
      const palette = pal
        ? pal
            .split('-')
            .filter((c) => /^[0-9a-fA-F]{6}$/.test(c))
            .map((c) => `#${c}`)
        : [];
      const shared: Prompt = {
        id: uid(),
        createdAt: Date.now(),
        kind: 'compartilhada',
        themeIds: [],
        parts: {},
        text: q.slice(0, 400),
        twist: params.get('d')?.slice(0, 200) || undefined,
        palette: palette.length ? palette : undefined,
      };
      store.pushPrompt(shared, false);
      setCursor(0);
      setParams({}, { replace: true });
    } else if (data.history.length === 0) {
      roll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // opcional: gerar uma ideia nova assim que o tema mudar
  const themeKey = s.themeIds.join(',');
  const prevThemeKey = useRef(themeKey);
  useEffect(() => {
    if (prevThemeKey.current === themeKey) return;
    prevThemeKey.current = themeKey;
    if (s.autoOnThemeChange) roll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey]);

  const rollBatch = () => {
    const out: Prompt[] = [];
    const avoid = recentTexts();
    for (let i = 0; i < s.batchSize; i++) {
      out.push(generate(optionsFrom(s, selectedThemes, { previous: out[i - 1] }, [...avoid, ...out.map((p) => p.text)])));
    }
    setBatch(out);
  };

  const toggleLock = (k: PartKey) => setLocks((l) => ({ ...l, [k]: !l[k] }));

  const onReroll = (k: PartKey) => {
    if (!current) return;
    const next = rerollPart(current, k, selectedThemes, s.genericWords);
    if (next !== current) {
      store.pushPrompt(next, false);
      setCursor(0);
    }
  };

  const isSaved = current ? store.isSaved(current.text) : false;

  const save = () => {
    if (!current) return;
    store.toast(store.toggleSave(current) ? 'Salvo nos favoritos ♥' : 'Removido dos favoritos');
  };

  const copy = async () => {
    if (!current) return;
    store.toast((await copyText(promptToText(current))) ? 'Ideia copiada' : 'Não consegui copiar');
  };

  const share = async () => {
    if (!current) return;
    const r = await sharePrompt(current);
    if (r === 'copied') store.toast('Link copiado. É só colar onde quiser');
    else if (r === 'failed') store.toast('Não foi possível compartilhar');
  };

  const card = async (format: 'feed' | 'square' | 'story') => {
    if (!current) return;
    await downloadPromptCard(current, format);
    store.toast(format === 'feed' ? 'Cartão para feed baixado' : format === 'square' ? 'Cartão quadrado baixado' : 'Cartão para Stories baixado');
  };

  const drew = () => {
    if (!current) return;
    store.completePrompt(current);
    store.toast('Registrado! Mais um desenho hoje ✦');
  };

  const sketch = (p: Prompt) => navigate('/rabiscar', { state: { prompt: p } });

  const useDaily = () => {
    store.pushPrompt({ ...daily, id: uid(), createdAt: Date.now() }, true);
    setCursor(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------- apagar do histórico
  const removeAt = (index: number) => {
    const p = history[index];
    if (!p) return;
    store.removePrompt(p.id);
    setCursor((c) => (index < c ? c - 1 : c));
    store.toast('Ideia apagada do histórico');
  };

  const clearHistory = () => {
    if (!history.length) return;
    if (window.confirm(`Apagar todas as ${history.length} ideias do histórico? Seus favoritos não serão afetados.`)) {
      store.clearHistory();
      setCursor(0);
      setLocks({});
      store.toast('Histórico apagado');
    }
  };

  // ---------- opções
  const toggleCustomPart = (k: PartKey) => {
    const cur = s.customParts;
    const next = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
    if (next.length) store.setSettings({ customParts: next });
  };

  // atalhos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(t.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('.modal-ov')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        roll();
      } else if (e.key === 'ArrowLeft') {
        setCursor((c) => Math.min(c + 1, history.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key.toLowerCase() === 's') {
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll, history.length, current]);

  const lockedCount = Object.values(locks).filter(Boolean).length;
  const visibleHistory = showAll ? history : history.slice(0, 10);

  return (
    <div className="w page">
      <div className="gen-head up">
        <p className="sub">
          <Sparkle size={12} /> Hiraku SketchQuest <Sparkle size={12} />
        </p>
        <h1>
          O que <em>desenhar</em> hoje?
        </h1>
        <p className="lead">Escolha um tema, sorteie uma ideia e comece a rabiscar. Sem bloqueio criativo, sem desculpa.</p>
      </div>

      <ThemePicker />

      <div className="stage up" style={cssVars({ '--d': 2 })}>
        {current ? (
          <PromptCard
            prompt={current}
            locks={locks}
            onToggleLock={toggleLock}
            onRerollPart={onReroll}
            onNewTwist={() => store.patchPrompt(current.id, { twist: newTwist(current).twist })}
            onNewPalette={() => store.patchPrompt(current.id, { palette: newPalette(current, s.paletteSize, s.paletteHarmony).palette })}
          />
        ) : (
          <div className="pcard empty-state">
            <p className="pcard-text">Nenhuma ideia por aqui.</p>
            <p className="hint">O histórico está vazio. Clique em “Gerar ideia” para começar de novo.</p>
          </div>
        )}

        <div className="main-actions">
          <button type="button" className="btn p big" onClick={roll}>
            🎲 Gerar ideia{lockedCount ? ` (mantendo ${lockedCount})` : ''}
            <span className="kbd">Espaço</span>
          </button>
        </div>

        <div className="actions" role="toolbar" aria-label="Ações da ideia">
          <button type="button" className="btn" onClick={() => setCursor((c) => Math.min(c + 1, history.length - 1))} disabled={safeCursor >= history.length - 1}>
            ← Anterior
          </button>
          <button type="button" className="btn" onClick={() => setCursor((c) => Math.max(c - 1, 0))} disabled={safeCursor === 0}>
            Próxima →
          </button>
          <button type="button" className={`btn${isSaved ? ' on' : ''}`} onClick={save} aria-pressed={isSaved} disabled={!current}>
            {isSaved ? '♥ Salva' : '♡ Salvar'}
          </button>
          <button type="button" className="btn" onClick={drew} disabled={!current}>
            ✓ Desenhei
          </button>
          {current ? (
            <button type="button" className="btn" onClick={() => sketch(current)}>
              ✎ Rabiscar
            </button>
          ) : null}
          <button type="button" className="btn" onClick={copy} disabled={!current}>
            Copiar
          </button>
          <button type="button" className="btn" onClick={share} disabled={!current}>
            Compartilhar
          </button>
          <button type="button" className="btn" onClick={() => card('feed')} disabled={!current} title="Imagem vertical 1080 × 1350 para feed">
            Baixar feed
          </button>
          <button type="button" className="btn" onClick={() => card('square')} disabled={!current} title="Imagem quadrada 1080 × 1080">
            Baixar quadrado
          </button>
          <button type="button" className="btn" onClick={() => card('story')} disabled={!current} title="Imagem vertical 1080 × 1920 para Stories">
            Baixar Stories
          </button>
          <button type="button" className="btn danger" onClick={() => removeAt(safeCursor)} disabled={!current} title="Apaga esta ideia do histórico">
            🗑 Apagar esta
          </button>
        </div>

        <div className="opts-wrap">
          <button type="button" className="linkish" onClick={() => setShowOpts((v) => !v)} aria-expanded={showOpts}>
            {showOpts ? '− Esconder opções' : '+ Opções de geração'}
          </button>
          {showOpts ? (
            <div className="opts card">
              <div className="opt-group">
                <h4>Frases</h4>
                <Segmented label="Tipo de frase" value={s.mode} options={MODE_OPTIONS} onChange={(mode) => store.setSettings({ mode })} />
                {s.mode === 'misto' ? (
                  <Segmented
                    label="Frases prontas no modo misto"
                    value={String(s.premadeShare)}
                    options={SHARE_OPTIONS}
                    onChange={(v) => store.setSettings({ premadeShare: Number(v) })}
                  />
                ) : null}
                <Segmented label="Nível de detalhe" value={s.detail} options={DETAIL_OPTIONS} onChange={(detail) => store.setSettings({ detail })} />
                {s.detail === 'personalizado' ? (
                  <div className="field">
                    <span className="field-l">Partes da frase</span>
                    <div className="chips" role="group" aria-label="Partes da frase">
                      {PART_KEYS.map((k) => (
                        <button
                          key={k}
                          type="button"
                          className={`chip${s.customParts.includes(k) ? ' on' : ''}`}
                          aria-pressed={s.customParts.includes(k)}
                          onClick={() => toggleCustomPart(k)}
                        >
                          {PART_LABEL[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <Segmented
                  label="Palavras genéricas misturadas"
                  value={s.genericWords}
                  options={GENERIC_OPTIONS}
                  onChange={(genericWords) => store.setSettings({ genericWords })}
                />
              </div>

              <div className="opt-group">
                <h4>Extras</h4>
                <div className="switches">
                  <Switch label="Desafio extra" hint="uma regra para apimentar" checked={s.twist} onChange={(twist) => store.setSettings({ twist })} />
                  <Switch label="Paleta sugerida" hint="cores de partida" checked={s.palette} onChange={(palette) => store.setSettings({ palette })} />
                </div>
                {s.palette ? (
                  <div className="opt-row" style={{ marginTop: 16 }}>
                    <Segmented label="Cores na paleta" value={String(s.paletteSize)} options={PALETTE_SIZES} onChange={(v) => store.setSettings({ paletteSize: Number(v) })} />
                    <label className="field">
                      <span className="field-l">Harmonia da paleta</span>
                      <select value={s.paletteHarmony} onChange={(e) => store.setSettings({ paletteHarmony: e.target.value as Harmony | 'qualquer' })}>
                        <option value="qualquer">🎲 Qualquer uma</option>
                        {HARMONIES.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="opt-group">
                <h4>Comportamento</h4>
                <div className="switches">
                  <Switch label="Não repetir ideias recentes" hint="evita as últimas 30 do histórico" checked={s.avoidRepeats} onChange={(avoidRepeats) => store.setSettings({ avoidRepeats })} />
                  <Switch label="Gerar ao trocar de tema" hint="sorteia assim que você aplica" checked={s.autoOnThemeChange} onChange={(autoOnThemeChange) => store.setSettings({ autoOnThemeChange })} />
                  <Switch label="Som no cronômetro" checked={s.sound} onChange={(sound) => store.setSettings({ sound })} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <Segmented label="Tamanho do lote" value={String(s.batchSize)} options={BATCH_SIZES} onChange={(v) => store.setSettings({ batchSize: Number(v) })} />
                </div>
              </div>

              <div className="opt-foot">
                <p className="hint">
                  Dica: nas frases aleatórias, clique numa parte para travá-la (🔒) e gere de novo só o resto, ou use o 🎲 de cada parte.
                </p>
                <button type="button" className="btn sm" onClick={() => store.setSettings({ ...DEFAULT_SETTINGS, themeIds: s.themeIds })}>
                  Restaurar padrões
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <section className="block">
        <div className="block-head">
          <div>
            <p className="k">// ideia do dia</p>
            <h2>
              Desafio de <em>hoje</em>
            </h2>
          </div>
          <div className="btns">
            <button type="button" className="btn p" onClick={useDaily}>
              Usar esta ideia
            </button>
            <button type="button" className="btn" onClick={() => sketch(daily)}>
              ✎ Rabiscar agora
            </button>
          </div>
        </div>
        <PromptCard prompt={daily} compact />
      </section>

      <section className="block">
        <div className="block-head">
          <div>
            <p className="k">// lote</p>
            <h2>
              Várias de <em>uma vez</em>
            </h2>
          </div>
          <div className="btns">
            <button type="button" className="btn" onClick={rollBatch}>
              Gerar lote de {s.batchSize}
            </button>
            {batch.length ? (
              <button type="button" className="btn" onClick={() => setBatch([])}>
                Limpar lote
              </button>
            ) : null}
          </div>
        </div>
        {batch.length ? (
          <ol className="list">
            {batch.map((p) => (
              <li key={p.id} className="li">
                <div className="li-main">
                  <span>{p.text}</span>
                  {p.twist ? <small>Desafio: {p.twist}</small> : null}
                </div>
                <div className="li-act">
                  <button type="button" className="mini" onClick={() => store.toast(store.toggleSave(p) ? 'Salvo ♥' : 'Removido')} aria-label="Salvar ou remover dos favoritos">
                    {store.isSaved(p.text) ? '♥' : '♡'}
                  </button>
                  <button
                    type="button"
                    className="mini"
                    onClick={() => {
                      store.pushPrompt(p);
                      setCursor(0);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    aria-label="Usar esta ideia"
                    title="Usar"
                  >
                    ↑
                  </button>
                  <button type="button" className="mini" onClick={() => sketch(p)} aria-label="Rabiscar esta ideia" title="Rabiscar">
                    ✎
                  </button>
                  <button type="button" className="mini x" onClick={() => setBatch((b) => b.filter((x) => x.id !== p.id))} aria-label="Descartar do lote" title="Descartar">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">Ótimo para listas de ideias, desafios de fim de semana ou quando você quer escolher entre várias.</p>
        )}
      </section>

      {history.length > 0 ? (
        <section className="block">
          <div className="block-head">
            <div>
              <p className="k">// histórico · {history.length}</p>
              <h2>
                Últimas <em>ideias</em>
              </h2>
            </div>
            <button type="button" className="btn danger" onClick={clearHistory}>
              🗑 Limpar histórico
            </button>
          </div>
          <ol className="list">
            {visibleHistory.map((p, i) => (
              <li key={p.id} className={`li${i === safeCursor ? ' current' : ''}`}>
                <button
                  type="button"
                  className="li-main as-btn"
                  onClick={() => {
                    setCursor(i);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span>{p.text}</span>
                </button>
                <div className="li-act">
                  <button type="button" className="mini x" onClick={() => removeAt(i)} aria-label="Apagar esta ideia do histórico" title="Apagar">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
          {history.length > 10 ? (
            <div className="btns">
              <button type="button" className="btn sm" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Mostrar menos' : `Ver todas (${history.length})`}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
