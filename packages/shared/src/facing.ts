import type { Facing } from './character.js';

/**
 * Smooths facing changes the way classic sprite MMOs read: two keys are rarely pressed or released on
 * the same frame, so a diagonal walk briefly reports a cardinal direction at its start and end. A new
 * facing must persist for SETTLE_MS before it shows, except when starting from idle (turn at once).
 * Stopping keeps the facing the character was walking in.
 */
const SETTLE_MS = 70;

export class FacingTracker {
  private pending: { facing: Facing; since: number } | null = null;
  private moving = false;

  constructor(private shown: Facing) {}

  get facing() { return this.shown; }

  /** Turn at once (e.g. toward an attacked monster), dropping any pending change. */
  set(facing: Facing) { this.shown = facing; this.pending = null; }

  /** candidate: facing implied by current movement, or null when idle. now: ms timestamp. */
  update(candidate: Facing | null, now: number): Facing {
    if (candidate === null) {
      this.moving = false;
      this.pending = null;
      return this.shown;
    }
    if (!this.moving) {
      this.moving = true;
      this.shown = candidate;
      this.pending = null;
      return this.shown;
    }
    if (candidate === this.shown) {
      this.pending = null;
    } else if (!this.pending || this.pending.facing !== candidate) {
      this.pending = { facing: candidate, since: now };
    } else if (now - this.pending.since >= SETTLE_MS) {
      this.shown = candidate;
      this.pending = null;
    }
    return this.shown;
  }
}
