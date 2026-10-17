// One clock per actor/action. Changing direction never resets the phase.
export class SpriteClock {
  constructor(manifest) {
    this.manifest = manifest;
    this.elapsedMs = 0;
    this.direction = manifest.directions[0];
  }
  setDirection(direction) {
    if (!this.manifest.directions.includes(direction)) throw new Error('Unknown direction');
    this.direction = direction;
  }
  seek(ms) { this.elapsedMs = Math.max(0, ms); }
  advance(deltaMs) {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new Error('Invalid elapsed time');
    this.elapsedMs += deltaMs;
    return this.frame();
  }
  frame(direction = this.direction) {
    const m = this.manifest;
    const frames = m.frames.filter(f => f.direction === direction);
    let t = m.loop ? this.elapsedMs % m.durationMs : Math.min(this.elapsedMs, m.durationMs - 0.00001);
    for (const frame of frames) {
      if (t < frame.durationMs) return frame;
      t -= frame.durationMs;
    }
    return frames.at(-1);
  }
}

// Phaser adapter for an isolated review scene; no room/server state changes.
// Import this module, add the exported sheet with frameWidth/Height=manifest.size,
// then tick once per actor and call face() without restarting a Phaser animation.
export class PhaserSpritePlayer {
  constructor(sprite, manifest, textureKey) {
    this.sprite = sprite;
    this.clock = new SpriteClock(manifest);
    this.textureKey = textureKey;
  }
  face(direction) { this.clock.setDirection(direction); this.draw(); }
  tick(deltaMs) { this.clock.advance(deltaMs); this.draw(); }
  draw() {
    const m = this.clock.manifest, f = this.clock.frame();
    this.sprite.setTexture(this.textureKey, m.directions.indexOf(f.direction)*m.framesPerDirection+f.index);
    this.sprite.setOrigin(f.groundAnchor[0]/m.size, f.groundAnchor[1]/m.size);
  }
}
