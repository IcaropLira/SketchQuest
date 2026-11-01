import { useEffect } from 'react';

export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · Hiraku SketchQuest` : 'Hiraku SketchQuest — o que desenhar hoje?';
  }, [title]);
}
