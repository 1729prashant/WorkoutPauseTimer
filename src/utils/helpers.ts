/**
 * Format milliseconds to hh:mm:ss.cs (hours, minutes, seconds, centiseconds)
 */
export function formatTime(ms: number): string {
  if (ms < 0) ms = 0;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

/**
 * Format milliseconds to a simpler m:ss or s.cs for shorter statistics displays
 */
export function formatShortDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (num: number) => num.toString().padStart(2, '0');
  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }
  return `${seconds}.${pad(centiseconds)}s`;
}

/**
 * Synthesize simple high-quality retro gym stopwatch sounds using Web Audio API
 */
export function playStopwatchSound(type: 'start' | 'pause' | 'reset', volumeEnabled: boolean) {
  if (!volumeEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      // High-pitched quick chirp
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'pause') {
      // Double chirp (high then slightly higher)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);

      // Second tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1300, ctx.currentTime + 0.06);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc2.start(ctx.currentTime + 0.06);
      osc2.stop(ctx.currentTime + 0.14);
    } else if (type === 'reset') {
      // Deep descending sweep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (error) {
    console.warn('Web Audio playback failed or blocked:', error);
  }
}
