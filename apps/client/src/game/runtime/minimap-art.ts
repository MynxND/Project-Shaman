// A picture of the whole map (ground and buildings, no night overlay or characters), rendered once by the scene
// from the same sprites the world uses. The minimap and world map draw from it.
let art: HTMLImageElement | null = null;
const listeners = new Set<(img: HTMLImageElement | null) => void>();

export function publishMapArt(img: HTMLImageElement | null) { art = img; listeners.forEach((l) => l(img)); }
export function readMapArt() { return art; }
export function subscribeMapArt(fn: (img: HTMLImageElement | null) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
