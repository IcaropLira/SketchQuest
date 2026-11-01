import type { CSSProperties } from 'react';

interface Props {
  size: number;
  style?: CSSProperties;
  className?: string;
}

/** Centelha de quatro pontas. Precisa do gradiente #sg definido em algum <svg> da página (ver Layout). */
export default function Sparkle({ size, style, className }: Props) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="url(#sg)" d="M12,0Q13,11 24,12Q13,13 12,24Q11,13 0,12Q11,11 12,0Z" />
    </svg>
  );
}
