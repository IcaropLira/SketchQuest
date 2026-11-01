import { PART_KEYS, PART_LABEL, type PartKey, type Prompt } from '../types';
import { agree, agreeInline, capitalize, indefinite, parseNoun } from '../lib/grammar';
import { useStore } from '../store/store';
import PaletteStrip from './PaletteStrip';

interface Props {
  prompt: Prompt;
  locks?: Partial<Record<PartKey, boolean>>;
  onToggleLock?: (key: PartKey) => void;
  onRerollPart?: (key: PartKey) => void;
  onNewTwist?: () => void;
  onNewPalette?: () => void;
  compact?: boolean;
}

/** Texto de exibição de cada parte, já concordando com o sujeito. */
function partLabel(prompt: Prompt, key: PartKey): string {
  const part = prompt.parts[key];
  if (!part) return '';
  if (key === 'subject') return capitalize(indefinite(part.text));
  if (key === 'adjective') {
    const subj = prompt.parts.subject?.text;
    const n = subj ? parseNoun(subj) : { fem: false, plural: false };
    return agree(part.text, n.fem, n.plural);
  }
  if (key === 'action') {
    const subj = prompt.parts.subject?.text;
    const n = subj ? parseNoun(subj) : { fem: false, plural: false };
    return agreeInline(part.text, n.fem, n.plural);
  }
  return part.text;
}

export default function PromptCard({ prompt, locks, onToggleLock, onRerollPart, onNewTwist, onNewPalette, compact }: Props) {
  const { themeById } = useStore();
  const themes = prompt.themeIds.map((id) => themeById(id)).filter((t) => !!t);
  const interactive = prompt.kind === 'aleatoria' && !!onToggleLock;
  const keys = PART_KEYS.filter((k) => prompt.parts[k]);

  return (
    <article className={`pcard${compact ? ' compact' : ''}`} aria-live="polite">
      <div className="pcard-top">
        <span className="tag">
          {prompt.kind === 'pronta' ? 'frase pronta' : prompt.kind === 'compartilhada' ? 'ideia compartilhada' : 'frase aleatória'}
        </span>
        <span className="pcard-themes">
          {themes.slice(0, 4).map((t) => (
            <span key={t!.id} title={t!.name}>
              {t!.emoji}
            </span>
          ))}
        </span>
      </div>

      <p className="pcard-text">{prompt.text}</p>

      {interactive && keys.length > 0 ? (
        <div className="parts" role="group" aria-label="Partes da ideia">
          {keys.map((k) => (
            <div key={k} className={`part${locks?.[k] ? ' locked' : ''}`}>
              <button
                type="button"
                className="part-lock"
                onClick={() => onToggleLock?.(k)}
                aria-pressed={!!locks?.[k]}
                title={locks?.[k] ? 'Destravar: será sorteado de novo' : 'Travar: mantém ao gerar outra ideia'}
              >
                <span className="part-k">{PART_LABEL[k]}</span>
                <span className="part-v">{partLabel(prompt, k)}</span>
                <span aria-hidden="true">{locks?.[k] ? '🔒' : ''}</span>
              </button>
              <button
                type="button"
                className="part-roll"
                onClick={() => onRerollPart?.(k)}
                aria-label={`Sortear de novo: ${PART_LABEL[k]}`}
                title="Sortear só esta parte"
              >
                🎲
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {prompt.twist ? (
        <div className="extra">
          <span className="k-inline">Desafio</span>
          <span>{capitalize(prompt.twist)}.</span>
          {onNewTwist ? (
            <button type="button" className="mini" onClick={onNewTwist} aria-label="Outro desafio" title="Outro desafio">
              🎲
            </button>
          ) : null}
        </div>
      ) : null}

      {prompt.palette?.length ? (
        <div className="extra">
          <span className="k-inline">Paleta</span>
          <PaletteStrip colors={prompt.palette} />
          {onNewPalette ? (
            <button type="button" className="mini" onClick={onNewPalette} aria-label="Outra paleta" title="Outra paleta">
              🎲
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
