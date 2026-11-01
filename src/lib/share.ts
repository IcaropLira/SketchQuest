import type { Prompt } from '../types';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function promptToText(p: Pick<Prompt, 'text' | 'twist' | 'palette'>): string {
  let s = p.text;
  if (p.twist) s += `\nDesafio: ${p.twist}.`;
  if (p.palette?.length) s += `\nPaleta: ${p.palette.join(' ')}`;
  return s;
}

export function shareUrl(p: Pick<Prompt, 'text' | 'twist' | 'palette'>): string {
  const u = new URL(window.location.origin + '/');
  u.searchParams.set('q', p.text);
  if (p.twist) u.searchParams.set('d', p.twist);
  if (p.palette?.length) u.searchParams.set('p', p.palette.map((c) => c.replace('#', '')).join('-'));
  return u.toString();
}

/** Usa o menu nativo de compartilhar quando existe; senão copia o link. */
export async function sharePrompt(p: Pick<Prompt, 'text' | 'twist' | 'palette'>): Promise<'shared' | 'copied' | 'failed'> {
  const url = shareUrl(p);
  const data = { title: 'Hiraku SketchQuest', text: promptToText(p), url };
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'failed';
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed';
}

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadText(name: string, text: string, mime = 'text/plain'): void {
  downloadBlob(name, new Blob([text], { type: `${mime};charset=utf-8` }));
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Gera um cartão PNG (1080×1350) com a ideia, pronto para postar. */
export async function downloadPromptCard(p: Pick<Prompt, 'text' | 'twist' | 'palette'>): Promise<void> {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;

  try {
    await Promise.all([
      document.fonts.load('500 64px "Playfair Display"'),
      document.fonts.load('500 28px "Fira Code"'),
    ]);
  } catch {
    /* fontes do sistema servem */
  }

  ctx.fillStyle = '#0d0817';
  ctx.fillRect(0, 0, W, H);
  const glow = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(13,8,23,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(W / 2, 260, 700, 'rgba(238,15,127,0.22)');
  glow(120, H - 160, 640, 'rgba(59,36,119,0.55)');
  glow(W - 100, 820, 520, 'rgba(255,141,184,0.14)');

  ctx.strokeStyle = '#2a1f45';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(48, 48, W - 96, H - 96, 36);
  ctx.stroke();

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#ee0f7f');
  grad.addColorStop(0.5, '#ff8db8');
  grad.addColorStop(1, '#6b3fa0');

  ctx.textAlign = 'center';
  ctx.fillStyle = grad;
  ctx.font = '500 30px "Fira Code", monospace';
  ctx.fillText('✦  O QUE DESENHAR HOJE?  ✦', W / 2, 150);

  ctx.fillStyle = '#ece6f7';
  ctx.font = '500 64px "Playfair Display", Georgia, serif';
  const lines = wrap(ctx, p.text, W - 220);
  const lineH = 84;
  let y = 330;
  if (lines.length <= 4) y += 70;
  for (const l of lines.slice(0, 9)) {
    ctx.fillText(l, W / 2, y);
    y += lineH;
  }

  if (p.twist) {
    y += 50;
    ctx.fillStyle = '#ff8db8';
    ctx.font = '500 30px "Fira Code", monospace';
    ctx.fillText('DESAFIO', W / 2, y);
    y += 52;
    ctx.fillStyle = '#9d90b8';
    ctx.font = '400 38px Inter, system-ui, sans-serif';
    for (const l of wrap(ctx, p.twist, W - 260).slice(0, 3)) {
      ctx.fillText(l, W / 2, y);
      y += 52;
    }
  }

  if (p.palette?.length) {
    const size = 120;
    const gap = 18;
    const total = p.palette.length * size + (p.palette.length - 1) * gap;
    let x = (W - total) / 2;
    const py = H - 330;
    for (const col of p.palette) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(x, py, size, size, 26);
      ctx.fill();
      x += size + gap;
    }
  }

  ctx.fillStyle = grad;
  ctx.font = '500 34px "Playfair Display", Georgia, serif';
  ctx.fillText('Hiraku SketchQuest', W / 2, H - 120);

  await new Promise<void>((resolve) => {
    c.toBlob((b) => {
      if (b) downloadBlob('sketchquest-ideia.png', b);
      resolve();
    }, 'image/png');
  });
}
