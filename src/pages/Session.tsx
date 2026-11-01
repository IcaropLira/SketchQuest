import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Switch } from '../components/Controls';
import PromptCard from '../components/PromptCard';
import ThemePicker from '../components/ThemePicker';
import { SESSION_DURATIONS } from '../data/extras';
import { formatDuration } from '../lib/dates';
import { generate, optionsFrom } from '../lib/generator';
import { beep } from '../lib/sound';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/store';
import type { Prompt } from '../types';

type Phase = 'config' | 'run' | 'done';

const COUNTS = [3, 5, 8, 10, 15];
const RING = 2 * Math.PI * 54;

export default function Session() {
  const store = useStore();
  const navigate = useNavigate();
  const storeRef = useRef(store);
  storeRef.current = store;

  const [phase, setPhase] = useState<Phase>('config');
  const [duration, setDuration] = useState(120);
  const [customMin, setCustomMin] = useState('');
  const [count, setCount] = useState(5);
  const [items, setItems] = useState<Prompt[]>([]);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [spentTotal, setSpentTotal] = useState(0);

  const endAt = useRef(0);
  const idxRef = useRef(0);
  const itemsRef = useRef<Prompt[]>([]);
  const durRef = useRef(120);
  const spentRef = useRef(0);
  const leftWhenPaused = useRef(0);

  usePageTitle(phase === 'run' ? `${formatDuration(remaining)} · desenhe!` : 'Sessão cronometrada');

  const finish = useCallback(() => {
    setSpentTotal(spentRef.current);
    setPhase('done');
    setPaused(false);
    storeRef.current.addSession(spentRef.current / 60);
    storeRef.current.logDay();
  }, []);

  const start = () => {
    const list: Prompt[] = [];
    const { data, selectedThemes } = store;
    for (let i = 0; i < count; i++) {
      list.push(generate(optionsFrom(data.settings, selectedThemes, { previous: list[i - 1] }, list.map((x) => x.text))));
    }
    const dur = customMin ? Math.max(10, Math.round(parseFloat(customMin.replace(',', '.')) * 60) || duration) : duration;
    durRef.current = dur;
    itemsRef.current = list;
    idxRef.current = 0;
    spentRef.current = 0;
    endAt.current = Date.now() + dur * 1000;
    setItems(list);
    setIdx(0);
    setRemaining(dur);
    setPaused(false);
    setPhase('run');
  };

  const advance = useCallback(() => {
    if (idxRef.current < itemsRef.current.length - 1) {
      idxRef.current += 1;
      setIdx(idxRef.current);
      endAt.current = Date.now() + durRef.current * 1000;
      setRemaining(durRef.current);
      return true;
    }
    return false;
  }, []);

  // relógio: calcula pelo horário final, então não "atrasa" se a aba ficar em segundo plano
  useEffect(() => {
    if (phase !== 'run' || paused) return;
    const id = window.setInterval(() => {
      const left = Math.ceil((endAt.current - Date.now()) / 1000);
      if (left > 0) {
        setRemaining(left);
        return;
      }
      if (storeRef.current.data.settings.sound) beep();
      spentRef.current += durRef.current;
      if (!advance()) {
        window.clearInterval(id);
        finish();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, paused, advance, finish]);

  // mantém a tela acesa durante a sessão
  useEffect(() => {
    if (phase !== 'run' || paused) return;
    const holder: { lock: WakeLockSentinel | null; cancelled: boolean } = { lock: null, cancelled: false };
    navigator.wakeLock
      ?.request('screen')
      .then((l) => {
        if (holder.cancelled) void l.release();
        else holder.lock = l;
      })
      .catch(() => undefined);
    return () => {
      holder.cancelled = true;
      holder.lock?.release().catch(() => undefined);
    };
  }, [phase, paused]);

  const togglePause = () => {
    if (paused) {
      endAt.current = Date.now() + leftWhenPaused.current * 1000;
      setPaused(false);
    } else {
      leftWhenPaused.current = Math.max(1, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(leftWhenPaused.current);
      setPaused(true);
    }
  };

  const skip = () => {
    const left = paused ? leftWhenPaused.current : Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
    spentRef.current += durRef.current - left;
    setPaused(false);
    if (!advance()) finish();
  };

  const stop = () => {
    const left = paused ? leftWhenPaused.current : Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
    spentRef.current += durRef.current - left;
    finish();
  };

  const reset = () => {
    setPhase('config');
    setItems([]);
  };

  // ---------------------------------------------------------------- configuração
  if (phase === 'config') {
    return (
      <div className="w page">
        <div className="page-head up">
          <p className="k">// sessão cronometrada</p>
          <h1>
            Aquecimento com <em>tempo</em>
          </h1>
          <p className="lead">
            Uma fila de ideias, um cronômetro por desenho. Quando o tempo acaba, apita e já vem a próxima. Ótimo para treinar traço rápido e
            destravar a mão.
          </p>
        </div>

        <div className="card form-card">
          <div className="field">
            <span className="field-l">Tempo por desenho</span>
            <div className="chips" role="radiogroup" aria-label="Tempo por desenho">
              {SESSION_DURATIONS.map((d) => (
                <button
                  key={d.seconds}
                  type="button"
                  role="radio"
                  aria-checked={!customMin && duration === d.seconds}
                  className={`chip${!customMin && duration === d.seconds ? ' on' : ''}`}
                  onClick={() => {
                    setDuration(d.seconds);
                    setCustomMin('');
                  }}
                >
                  {d.label}
                </button>
              ))}
              <label className="chip custom">
                <input
                  inputMode="decimal"
                  placeholder="outro"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 5))}
                  aria-label="Minutos personalizados"
                />
                min
              </label>
            </div>
          </div>

          <div className="field">
            <span className="field-l">Quantos desenhos</span>
            <div className="chips" role="radiogroup" aria-label="Quantidade de desenhos">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={count === n}
                  className={`chip${count === n ? ' on' : ''}`}
                  onClick={() => setCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-l">Temas da sessão</span>
            <ThemePicker />
          </div>

          <div className="switches">
            <Switch label="Desafio extra em cada desenho" checked={store.data.settings.twist} onChange={(twist) => store.setSettings({ twist })} />
            <Switch label="Paleta sugerida" checked={store.data.settings.palette} onChange={(palette) => store.setSettings({ palette })} />
            <Switch label="Apito ao fim de cada desenho" checked={store.data.settings.sound} onChange={(sound) => store.setSettings({ sound })} />
          </div>

          <div className="btns">
            <button type="button" className="btn p big" onClick={start}>
              ▶ Começar sessão
            </button>
          </div>
          <p className="hint">
            Total: ≈{' '}
            {Math.round(((customMin ? parseFloat(customMin.replace(',', '.')) * 60 || duration : duration) * count) / 60)} min. A tela fica acesa
            enquanto o cronômetro roda (se o seu navegador permitir).
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- resumo
  if (phase === 'done') {
    return (
      <div className="w page">
        <div className="page-head up">
          <p className="k">// sessão concluída</p>
          <h1>
            Boa! <em>{Math.max(1, Math.round(spentTotal / 60))} min</em> de traço
          </h1>
          <p className="lead">Hoje já conta no seu calendário. Salve as ideias que quiser revisitar.</p>
        </div>

        <ol className="list">
          {items.map((p) => (
            <li key={p.id} className="li">
              <div className="li-main">
                <span>{p.text}</span>
                {p.twist ? <small>Desafio: {p.twist}</small> : null}
              </div>
              <div className="li-act">
                <button
                  type="button"
                  className="mini"
                  onClick={() => store.toast(store.toggleSave(p) ? 'Salvo ♥' : 'Removido')}
                  aria-label="Salvar ou remover dos favoritos"
                >
                  {store.isSaved(p.text) ? '♥' : '♡'}
                </button>
                <button type="button" className="mini" onClick={() => navigate('/rabiscar', { state: { prompt: p } })} aria-label="Rabiscar esta ideia">
                  ✎
                </button>
              </div>
            </li>
          ))}
        </ol>

        <div className="btns">
          <button type="button" className="btn p" onClick={start}>
            Repetir com ideias novas
          </button>
          <button type="button" className="btn" onClick={reset}>
            Mudar configuração
          </button>
          <Link className="btn" to="/progresso">
            Ver progresso
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- rodando
  const current = items[idx];
  const frac = durRef.current > 0 ? remaining / durRef.current : 0;
  const low = remaining <= 10;

  return (
    <div className="w page run">
      <p className="k center">
        // desenho {idx + 1} de {items.length}
      </p>

      <div className={`ring${low ? ' low' : ''}${paused ? ' paused' : ''}`} role="timer" aria-label={`Faltam ${formatDuration(remaining)}`}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ee0f7f" />
              <stop offset="0.5" stopColor="#ff8db8" />
              <stop offset="1" stopColor="#6b3fa0" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" className="ring-bg" />
          <circle
            cx="60"
            cy="60"
            r="54"
            className="ring-fg"
            stroke="url(#rg)"
            strokeDasharray={RING}
            strokeDashoffset={RING * (1 - frac)}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="ring-t">
          <b>{formatDuration(remaining)}</b>
          <span>{paused ? 'pausado' : 'desenhe!'}</span>
        </div>
      </div>

      {current ? <PromptCard prompt={current} /> : null}

      <div className="actions center">
        <button type="button" className="btn p" onClick={togglePause}>
          {paused ? '▶ Retomar' : '❚❚ Pausar'}
        </button>
        <button type="button" className="btn" onClick={skip}>
          Pular →
        </button>
        <button type="button" className="btn" onClick={stop}>
          Encerrar
        </button>
      </div>

      <div className="progress-dots" aria-hidden="true">
        {items.map((p, i) => (
          <span key={p.id} className={i < idx ? 'd done' : i === idx ? 'd now' : 'd'} />
        ))}
      </div>
    </div>
  );
}
