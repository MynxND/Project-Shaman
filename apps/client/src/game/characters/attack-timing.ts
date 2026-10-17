/** Fit the visible one-shot into the server interval; keep every frame readable for at least 33ms. */
export function attackPlaybackScale(durationMs: number, delayMs: number | undefined, frames: number): number {
  if (!delayMs || !Number.isFinite(delayMs) || delayMs <= 0 || durationMs <= 0 || frames <= 0) return 1;
  return Math.max(1, durationMs / Math.max(delayMs, frames * 33));
}
