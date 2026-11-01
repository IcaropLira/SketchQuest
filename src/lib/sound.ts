let ctx: AudioContext | null = null;

/** Três bipes curtos, sem arquivo de áudio. */
export function beep(times = 3): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    const c = ctx;
    if (c.state === 'suspended') void c.resume();
    for (let i = 0; i < times; i++) {
      const t = c.currentTime + i * 0.22;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  } catch {
    /* sem áudio: tudo bem */
  }
}
