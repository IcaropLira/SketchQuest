import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cssVars } from '../lib/css';
import { useStore } from '../store/store';

const FOCUSABLE = 'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function ThemeModal({ onClose }: { onClose: () => void }) {
  const { themes, data, setThemeIds } = useStore();
  const [draft, setDraft] = useState<string[]>(() => {
    const ok = data.settings.themeIds.filter((id) => themes.some((t) => t.id === id));
    return ok.length ? ok : [themes[0]!.id];
  });
  const [q, setQ] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const toggle = (id: string) =>
    setDraft((d) => (d.includes(id) ? (d.length > 1 ? d.filter((x) => x !== id) : d) : [...d, id]));

  const apply = () => {
    setThemeIds(draft);
    onClose();
  };

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? themes.filter((t) => `${t.name} ${t.blurb}`.toLowerCase().includes(needle)) : themes;
  }, [q, themes]);

  const allSelected = draft.length === themes.length;

  return (
    <div className="modal-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="tm-title" ref={dialogRef} tabIndex={-1}>
        <div className="modal-h">
          <div>
            <p className="k">// temas</p>
            <h2 id="tm-title">Escolha o tema da vez</h2>
            <p className="hint" style={{ marginTop: 4 }}>
              Marque um para ficar nele, ou vários para misturar: cada parte da frase vem de um tema sorteado.
            </p>
          </div>
          <button type="button" className="mini" onClick={onClose} aria-label="Fechar sem aplicar">
            ✕
          </button>
        </div>

        <div className="modal-search">
          <input type="search" placeholder="Buscar tema…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar tema" />
        </div>

        <div className="modal-b">
          {shown.map((t) => {
            const on = draft.includes(t.id);
            return (
              <button key={t.id} type="button" className={`tt${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggle(t.id)} style={cssVars({ '--h': t.hue })}>
                <span className="tn-ic" aria-hidden="true">
                  {t.emoji}
                </span>
                <span className="tt-t">
                  <b>
                    {t.name} {t.custom ? <span className="badge">seu</span> : null}
                  </b>
                  <small>{t.blurb || 'Tema personalizado.'}</small>
                </span>
                <span className="tt-ck" aria-hidden="true">
                  {on ? '✓' : ''}
                </span>
              </button>
            );
          })}
          {shown.length === 0 ? <p className="muted">Nenhum tema encontrado.</p> : null}
        </div>

        <div className="modal-f">
          <div className="btns">
            <button type="button" className="btn sm" onClick={() => setDraft(allSelected ? [draft[0]!] : themes.map((t) => t.id))}>
              {allSelected ? 'Voltar para um só' : '🎲 Misturar todos'}
            </button>
            <Link className="btn sm" to="/meus-temas" onClick={onClose}>
              ＋ Criar meu tema
            </Link>
          </div>
          <div className="btns">
            <span className="hint" style={{ margin: 0, alignSelf: 'center' }}>
              {draft.length} selecionado{draft.length > 1 ? 's' : ''}
            </span>
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn p" onClick={apply}>
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Retângulo com o(s) tema(s) da vez. Ao clicar, abre o modal de seleção. */
export default function ThemePicker() {
  const { selectedThemes } = useStore();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const multi = selectedThemes.length > 1;
  const first = selectedThemes[0]!;

  const close = () => {
    setOpen(false);
    window.setTimeout(() => btnRef.current?.focus(), 0);
  };

  return (
    <>
      <button ref={btnRef} type="button" className="theme-now" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <span className="tn-icons" aria-hidden="true">
          {(multi ? selectedThemes.slice(0, 4) : [first]).map((t) => (
            <span key={t.id} className="tn-ic" style={cssVars({ '--h': t.hue })}>
              {t.emoji}
            </span>
          ))}
        </span>
        <span className="tn-text">
          <span className="tn-k">{multi ? `Mistura de ${selectedThemes.length} temas` : 'Tema da vez'}</span>
          <b>{multi ? selectedThemes.map((t) => t.name).join(' + ') : first.name}</b>
          <small>{multi ? 'Cada parte da frase vem de um dos temas escolhidos' : first.blurb || 'Tema personalizado'}</small>
        </span>
        <span className="tn-act">Trocar tema ▾</span>
      </button>
      {open ? <ThemeModal onClose={close} /> : null}
    </>
  );
}
