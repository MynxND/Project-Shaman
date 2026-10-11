import Phaser from 'phaser';
import type { MovementInput } from '@shaman/shared';
import { readTouchDirection } from './touch-stick';

/** Server drops input older than 300ms, so held keys are re-sent well inside that window. */
const RESEND_MS = 100;

/**
 * Reads WASD / arrow keys and the on-screen joystick (keyboard wins while a key is held) and emits movement intent:
 * immediately on change, then every RESEND_MS while held, and once with a zero vector on release so the server
 * stops at once.
 */
export class MovementController {
  private readonly keys: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key[]>;
  private sequence = 0;
  private last = { x: 0, y: 0 };
  /** The direction currently held, used by the scene for local prediction. */
  get current(): { x: number; y: number } { return this.last; }
  private sinceSend = 0;
  /** Automatic steering (walk toward a clicked monster); manual input always wins and clears it. */
  private auto: (() => { x: number; y: number } | null) | null = null;
  setAuto(steer: (() => { x: number; y: number } | null) | null) { this.auto = steer; }

  constructor(
    keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
    private readonly send: (input: MovementInput) => void,
    /** Predicted resting point attached to stops so the server does not keep the player sliding. */
    private readonly restingPoint: () => { x: number; y: number } | null = () => null,
  ) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    // No key capture: capturing would preventDefault WASD/arrows page-wide and block typing in HUD fields.
    const add = (...codes: number[]) => codes.map((code) => keyboard.addKey(code, false));
    this.keys = { up: add(K.W, K.UP), down: add(K.S, K.DOWN), left: add(K.A, K.LEFT), right: add(K.D, K.RIGHT) };
  }

  update(deltaMs: number) {
    // While a HUD field has focus, keys type text instead of moving the character.
    const active = document.activeElement;
    const typing = active instanceof HTMLElement && (active.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName));
    const held = (keys: Phaser.Input.Keyboard.Key[]) => !typing && keys.some((key) => key.isDown);
    let x = (held(this.keys.right) ? 1 : 0) - (held(this.keys.left) ? 1 : 0);
    let y = (held(this.keys.down) ? 1 : 0) - (held(this.keys.up) ? 1 : 0);
    if (x === 0 && y === 0) ({ x, y } = readTouchDirection());
    if (x !== 0 || y !== 0) this.auto = null;
    else if (this.auto) {
      const steer = this.auto();
      if (steer) ({ x, y } = steer); else this.auto = null;
    }
    this.sinceSend += deltaMs;
    const changed = x !== this.last.x || y !== this.last.y;
    const holding = x !== 0 || y !== 0;
    if (changed || (holding && this.sinceSend >= RESEND_MS)) {
      const stopAt = !holding ? this.restingPoint() : null;
      this.send(stopAt ? { x, y, sequence: ++this.sequence, stopAt } : { x, y, sequence: ++this.sequence });
      this.sinceSend = 0;
      this.last = { x, y };
    }
  }
}
