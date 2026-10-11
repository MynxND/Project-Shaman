import Phaser from 'phaser';

/** Closest zoom, as a multiple of the normal play zoom. */
const MAX_LEVEL = 1.6;
/** Wheel notch / key press changes the zoom by this factor. */
const STEP = 1.15;
/** Fraction of the remaining zoom change applied per 1/60 s (smooth, refresh-rate independent). */
const EASE = 0.25;

/**
 * Player-controlled camera zoom: mouse wheel, - / = keys, two-finger pinch on the game canvas. The zoom is a level
 * relative to the normal play zoom (1 = the RO-like default framing); zooming out stops when the map just covers the
 * screen on its tighter axis, so nothing outside the city walls is ever shown (user rule 2026-10-09). Purely visual: movement and rules never depend on it.
 */
export class CameraZoom {
  private level = 1;
  private shown = 1;
  private base = 1;
  private pinchStart: { dist: number; level: number } | null = null;
  private readonly onKey = (e: KeyboardEvent) => {
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '-' || e.key === '_') this.step(-1);
    else if (e.key === '=' || e.key === '+') this.step(1);
    else if (e.key === '0') this.set(1);
  };

  constructor(private readonly scene: Phaser.Scene, private readonly mapWidthPx: number, private readonly mapHeightPx: number) {
    const input = scene.input;
    input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    window.addEventListener('keydown', this.onKey);
  }

  /** Normal play zoom for the current screen size (set on resize). */
  setBase(base: number) {
    this.base = base;
    this.level = Math.min(MAX_LEVEL, Math.max(this.minLevel(), this.level));
    this.shown = this.level;
    this.apply();
  }

  get current() { return this.level; }

  /** Zoom out limit: the level at which the map still covers the whole screen (no area outside the map visible). */
  minLevel() {
    const cam = this.scene.cameras.main;
    const cover = Math.max(cam.width / this.mapWidthPx, cam.height / this.mapHeightPx) / this.base;
    return Math.min(1, cover);
  }

  set(level: number) { this.level = Math.min(MAX_LEVEL, Math.max(this.minLevel(), level)); }
  step(dir: 1 | -1) { this.set(dir > 0 ? this.level * STEP : this.level / STEP); }

  update(deltaMs: number) {
    if (Math.abs(this.shown - this.level) < 1e-3) { if (this.shown !== this.level) { this.shown = this.level; this.apply(); } return; }
    this.shown += (this.level - this.shown) * (1 - Math.pow(1 - EASE, deltaMs / (1000 / 60)));
    this.apply();
  }

  private apply() {
    const cam = this.scene.cameras.main;
    cam.setZoom(this.base * this.shown);
    // The camera stays inside the map; with minLevel() the view never exceeds the map, so no outside edge shows.
    cam.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
  }

  private onWheel(_p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) { if (dy !== 0) this.step(dy < 0 ? 1 : -1); }

  private onPointerMove() {
    const { pointer1: a, pointer2: b } = this.scene.input;
    if (!a?.isDown || !b?.isDown) { this.pinchStart = null; return; }
    const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    if (!this.pinchStart) { this.pinchStart = { dist, level: this.level }; return; }
    if (this.pinchStart.dist > 0) this.set(this.pinchStart.level * (dist / this.pinchStart.dist));
  }

  private onPointerUp() { this.pinchStart = null; }

  destroy() {
    const input = this.scene.input;
    input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    window.removeEventListener('keydown', this.onKey);
  }
}
