import Phaser from 'phaser';
import packed from '@/game-data/packed-textures.json';

// Start-up loading (user 2026-10-17: the game took minutes to load). The game asks for ~3,000 small frame PNGs; each
// is a separate request. tools/rig/pack_textures.mjs packs them into a few atlas sheets and writes
// packed-textures.json. LoaderPlugin.image is wrapped so a packed URL loads its sheet once and every key becomes a
// small canvas texture cut from it: same texture keys, same per-frame sizes, a few requests instead of thousands.
// URLs not in the index (new or changed art not re-packed yet) load normally.

type Entry = [atlas: number, x: number, y: number, w: number, h: number];
interface PackIndex { version: 'packed-textures/1'; atlases: { url: string }[]; entries: Record<string, Entry> }
const INDEX = packed as unknown as PackIndex;
const SHEET = (i: number) => `packed-sheet:${i}`;

let installed = false;
/** Dev: every image URL the game requested, so the pack list can be refreshed (window.__shamanImageUrls). */
const requested = new Set<string>();
const cleaned = new WeakSet<Phaser.Loader.LoaderPlugin>();

export function installPackedTextures() {
  if (installed) return;
  installed = true;
  // Phaser copies registered file types onto each loader instance, so the 'image' factory itself is replaced.
  const types = Phaser.Loader.FileTypesManager as unknown as { install: (o: object) => void; register: (k: string, f: unknown) => void };
  const current: { image?: (...a: unknown[]) => unknown } = {};
  types.install(current);
  const image = current.image!;
  if (process.env.NODE_ENV === 'development') (window as unknown as { __shamanImageUrls?: Set<string> }).__shamanImageUrls = requested;
  types.register('image', function (this: Phaser.Loader.LoaderPlugin, key: unknown, url?: unknown, ...rest: unknown[]) {
    if (typeof key !== 'string' || typeof url !== 'string' || rest.length) return image.call(this, key, url, ...rest);
    requested.add(url);
    const entry = INDEX.version === 'packed-textures/1' ? INDEX.entries[url] : undefined;
    const textures = this.scene.textures;
    if (!entry || textures.exists(key)) return entry ? this : image.call(this, key, url);
    const sheet = SHEET(entry[0]);
    const cut = () => {
      if (textures.exists(key)) return;
      const source = textures.get(sheet).getSourceImage() as HTMLImageElement;
      const t = textures.createCanvas(key, entry[3], entry[4]);
      if (!t) return;
      t.context.drawImage(source, entry[1], entry[2], entry[3], entry[4], 0, 0, entry[3], entry[4]);
      t.refresh();
    };
    if (textures.exists(sheet)) { cut(); return this; }
    // The sheets are only a transport: once this load finishes, drop them so their GPU memory is not kept.
    if (!cleaned.has(this)) { cleaned.add(this); this.on('complete', () => { for (let i = 0; i < INDEX.atlases.length; i++) if (textures.exists(SHEET(i))) textures.remove(SHEET(i)); }); }
    // Cut when the sheet arrives (it is queued once; later keys for the same sheet just wait for it).
    this.once(`filecomplete-image-${sheet}`, cut);
    const queued = [this.list, this.inflight, this.queue].some(files =>
      files.entries.some(file => file.type === 'image' && file.key === sheet));
    if (!queued) image.call(this, sheet, INDEX.atlases[entry[0]]!.url);
    return this;
  });
}
