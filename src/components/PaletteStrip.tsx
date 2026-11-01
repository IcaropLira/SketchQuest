import { copyText } from '../lib/share';
import { readableOn } from '../lib/palette';
import { useStore } from '../store/store';

interface Props {
  colors: string[];
  size?: 'sm' | 'lg';
  locked?: boolean[];
  onToggleLock?: (index: number) => void;
}

/** Faixa de cores; clicar numa cor copia o código HEX. */
export default function PaletteStrip({ colors, size = 'sm', locked, onToggleLock }: Props) {
  const { toast } = useStore();

  const copy = async (c: string) => {
    toast((await copyText(c)) ? `${c.toUpperCase()} copiado` : 'Não consegui copiar');
  };

  return (
    <div className={`swatches ${size}`}>
      {colors.map((c, i) => (
        <div key={`${c}-${i}`} className="sw" style={{ background: c, color: readableOn(c) }}>
          <button type="button" className="sw-main" onClick={() => copy(c)} aria-label={`Copiar cor ${c}`}>
            {size === 'lg' ? <span className="sw-hex">{c.toUpperCase()}</span> : null}
          </button>
          {onToggleLock ? (
            <button
              type="button"
              className="sw-lock"
              onClick={() => onToggleLock(i)}
              aria-pressed={!!locked?.[i]}
              aria-label={locked?.[i] ? 'Destravar cor' : 'Travar cor'}
              title={locked?.[i] ? 'Destravar' : 'Travar esta cor'}
            >
              {locked?.[i] ? '🔒' : '🔓'}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
