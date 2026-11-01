import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useLocation } from 'react-router-dom';
import PromptCard from '../components/PromptCard';
import { BRAND_SWATCHES } from '../data/extras';
import { dayKey, formatDuration } from '../lib/dates';
import { generate, optionsFrom } from '../lib/generator';
import { downloadBlob } from '../lib/share';
import { beep } from '../lib/sound';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/store';
import type { Prompt } from '../types';

interface Pt {
  x: number;
  y: number;
}
interface Stroke {
  color: string;
  size: number;
  erase: boolean;
  pts: Pt[];
}

const W = 1280;
const H = 800;

/** O desenho fica em memória enquanto a aba estiver aberta, mesmo trocando de página. */
const memory: { strokes: Stroke[]; redo: Stroke[]; paper: string } = { strokes: [], redo: [], paper: '#fffaf0' };

const PAPERS = [
  { c: '#fffaf0', n: 'Creme' },
  { c: '#ffffff', n: 'Branco' },
  { c: '#e8d5b0', n: 'Kraft' },
  { c: '#1b1330', n: 'Noite' },
  { c: '#0d0817', n: 'Breu' },
];

const TIMERS = [2, 5, 10, 15, 30];

function style(ctx: CanvasRenderingContext2D, s: Stroke) {
  ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function paint(ctx: CanvasRenderingContext2D, s: Stroke) {
  const p = s.pts;
  if (p.length === 0) return;
  ctx.save();
  style(ctx, s);
  if (p.length === 1) {
    ctx.beginPath();
    ctx.arc(p[0]!.x, p[0]!.y, s.size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(p[0]!.x, p[0]!.y);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i]!.x + p[i + 1]!.x) / 2;
      const my = (p[i]!.y + p[i + 1]!.y) / 2;
      ctx.quadraticCurveTo(p[i]!.x, p[i]!.y, mx, my);
    }
    const last = p[p.length - 1]!;
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
  ctx.restore();
}

function segment(ctx: CanvasRenderingContext2D, s: Stroke, a: Pt, b: Pt) {
  ctx.save();
  style(ctx, s);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

export default function Sketchpad() {
  usePageTitle('Quadro de rabiscos');
  const store = useStore();
  const loc = useLocation();
  const nav = loc.state as { prompt?: Prompt; palette?: string[] } | null;

  const [prompt, setPrompt] = useState<Prompt | undefined>(() => nav?.prompt ?? store.data.history[0]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#2a1f45');
  const [size, setSize] = useState(6);
  const [paper, setPaper] = useState(memory.paper);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const [timerOn, setTimerOn] = useState(false);
  const [left, setLeft] = useState(0);
  const endAt = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Stroke | null>(null);

  const swatches = useMemo(() => nav?.palette ?? prompt?.palette ?? BRAND_SWATCHES, [nav?.palette, prompt?.palette]);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (const st of memory.strokes) paint(ctx, st);
  }, []);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const pos = (e: RPointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };

  const down = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const st: Stroke = { color, size: tool === 'eraser' ? size * 3 : size, erase: tool === 'eraser', pts: [pos(e)] };
    drawing.current = st;
    memory.strokes.push(st);
    memory.redo = [];
    const ctx = e.currentTarget.getContext('2d');
    if (ctx) paint(ctx, st);
    rerender();
  };

  const move = (e: RPointerEvent<HTMLCanvasElement>) => {
    const st = drawing.current;
    if (!st) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const prev = st.pts[st.pts.length - 1]!;
    const p = pos(e);
    st.pts.push(p);
    segment(ctx, st, prev, p);
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = null;
    redraw(); // redesenha suavizado
    rerender();
  };

  const undo = useCallback(() => {
    const st = memory.strokes.pop();
    if (st) memory.redo.push(st);
    redraw();
    rerender();
  }, [redraw]);

  const redo = useCallback(() => {
    const st = memory.redo.pop();
    if (st) memory.strokes.push(st);
    redraw();
    rerender();
  }, [redraw]);

  const clear = () => {
    if (!memory.strokes.length) return;
    if (window.confirm('Limpar todo o desenho? Isso não dá para desfazer.')) {
      memory.strokes = [];
      memory.redo = [];
      redraw();
      rerender();
    }
  };

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(c, 0, 0);
    out.toBlob((b) => {
      if (!b) return;
      downloadBlob(`sketchquest-${dayKey()}.png`, b);
      store.addSketch();
      store.logDay();
      store.toast('Rabisco baixado ✦');
    }, 'image/png');
  };

  const choosePaper = (c: string) => {
    memory.paper = c;
    setPaper(c);
  };

  const newIdea = () => {
    const p = generate(optionsFrom(store.data.settings, store.selectedThemes, { previous: prompt }, store.data.history.slice(0, 30).map((h) => h.text)));
    store.pushPrompt(p);
    setPrompt(p);
  };

  // cronômetro opcional
  useEffect(() => {
    if (!timerOn) return;
    const id = window.setInterval(() => {
      const l = Math.ceil((endAt.current - Date.now()) / 1000);
      if (l > 0) {
        setLeft(l);
        return;
      }
      window.clearInterval(id);
      setTimerOn(false);
      setLeft(0);
      if (store.data.settings.sound) beep();
      store.toast('Tempo! Finalize o traço ✦');
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerOn]);

  const startTimer = (min: number) => {
    endAt.current = Date.now() + min * 60_000;
    setLeft(min * 60);
    setTimerOn(true);
  };

  // atalhos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === 'e') setTool((v) => (v === 'pen' ? 'eraser' : 'pen'));
        else if (e.key === '[') setSize((s) => Math.max(1, s - 2));
        else if (e.key === ']') setSize((s) => Math.min(60, s + 2));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return (
    <div className="w page wide">
      <div className="page-head slim up">
        <p className="k">// quadro de rabiscos</p>
        <h1>
          Rabisque <em>aqui</em>
        </h1>
      </div>

      {prompt ? (
        <div className="sk-prompt">
          <PromptCard prompt={prompt} compact />
          <div className="sk-prompt-act">
            <button type="button" className="btn sm" onClick={newIdea}>
              🎲 Outra ideia
            </button>
            <div className="timer-chips" role="group" aria-label="Cronômetro">
              {timerOn ? (
                <button type="button" className="btn sm p" onClick={() => setTimerOn(false)} aria-label="Parar cronômetro">
                  ⏱ {formatDuration(left)} · parar
                </button>
              ) : (
                TIMERS.map((m) => (
                  <button key={m} type="button" className="chip sm" onClick={() => startTimer(m)} title={`Cronômetro de ${m} minutos`}>
                    ⏱ {m} min
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="toolbar" role="toolbar" aria-label="Ferramentas de desenho">
        <div className="tb-group">
          <button type="button" className={`tool${tool === 'pen' ? ' on' : ''}`} onClick={() => setTool('pen')} aria-pressed={tool === 'pen'}>
            ✎ Lápis
          </button>
          <button type="button" className={`tool${tool === 'eraser' ? ' on' : ''}`} onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'} title="Atalho: E">
            ⌫ Borracha
          </button>
        </div>

        <label className="tb-group size">
          <span>Espessura {size}</span>
          <input type="range" min={1} max={60} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Espessura do traço" />
          <i className="dot-preview" style={{ width: Math.min(size, 28), height: Math.min(size, 28), background: tool === 'eraser' ? 'transparent' : color }} aria-hidden="true" />
        </label>

        <div className="tb-group">
          <button type="button" className="tool" onClick={undo} disabled={memory.strokes.length === 0} title="Desfazer (Ctrl+Z)">
            ↶ Desfazer
          </button>
          <button type="button" className="tool" onClick={redo} disabled={memory.redo.length === 0} title="Refazer (Ctrl+Shift+Z)">
            ↷ Refazer
          </button>
          <button type="button" className="tool" onClick={clear} disabled={memory.strokes.length === 0}>
            Limpar
          </button>
          <button type="button" className="tool p" onClick={download} disabled={memory.strokes.length === 0}>
            ⬇ Baixar PNG
          </button>
        </div>
      </div>

      <div className="colors" role="group" aria-label="Cores">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            className={`cdot${color.toLowerCase() === c.toLowerCase() && tool === 'pen' ? ' on' : ''}`}
            style={{ background: c }}
            onClick={() => {
              setColor(c);
              setTool('pen');
            }}
            aria-label={`Usar a cor ${c}`}
          />
        ))}
        <label className="cdot cpick" title="Escolher outra cor">
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setTool('pen');
            }}
            aria-label="Escolher outra cor"
          />
          <span aria-hidden="true">＋</span>
        </label>
        <span className="sep" />
        {PAPERS.map((p) => (
          <button
            key={p.c}
            type="button"
            className={`cdot paper${paper === p.c ? ' on' : ''}`}
            style={{ background: p.c }}
            onClick={() => choosePaper(p.c)}
            aria-label={`Papel ${p.n}`}
            title={`Papel ${p.n}`}
          />
        ))}
      </div>

      <div className="canvas-wrap" style={{ background: paper }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          aria-label="Área de desenho"
        />
      </div>
      <p className="hint">
        Atalhos: <span className="kbd">Ctrl+Z</span> desfaz, <span className="kbd">E</span> alterna borracha, <span className="kbd">[</span>{' '}
        <span className="kbd">]</span> mudam a espessura. O desenho fica guardado enquanto esta aba estiver aberta. Baixe o PNG para não perder.
      </p>
    </div>
  );
}
