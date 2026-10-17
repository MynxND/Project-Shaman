import Phaser from 'phaser';
import { FoundationScene } from './scenes/FoundationScene';
import { installPackedTextures } from './packed-textures';
export function createGame(parent: HTMLElement) {
  installPackedTextures();
  return new Phaser.Game({ type: Phaser.AUTO, parent, backgroundColor: '#142a2d',
    // A hidden, not-yet-laid-out or just-unmounted parent reports 0x0, which makes WebGL framebuffers incomplete.
    // RESIZE polls the parent every frame (also between React removing the node and the effect cleanup), so clamp to 1x1.
    scale: { mode: Phaser.Scale.RESIZE, width: Math.max(1, parent.clientWidth), height: Math.max(1, parent.clientHeight), min: { width: 1, height: 1 } },
    scene: [FoundationScene], input: { activePointers: 3 } });
}
