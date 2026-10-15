// River/fall native pixels per second; pond/swamp oscillator rates. Independently configurable.
export const waterDefaults = () => ({ mode: 'map', speed: 1, rates: [8, .14, .07, 40], ripple: .55, color: [.10, .24, .25], shore: true, paused: false, before: false, step: 0, flow: [0, 0] });
export function advanceWater(clock, deltaMs, paused, speed, step = 0) {
    if (!paused)
        clock.seconds += Math.max(0, deltaMs) / 1000 * Math.max(0, speed);
    clock.seconds += Math.max(0, step);
    return clock.seconds;
}
export function coverZoom(viewW, viewH, mapW, mapH) { return Math.max(viewW / mapW, viewH / mapH); }
/** Stable ripple phases, independent of camera, gameplay RNG and render FPS. */
export function waterSeed(mapId, x, y) { let n = 2166136261; for (const c of `${mapId}:${x}:${y}`)
    n = Math.imul(n ^ c.charCodeAt(0), 16777619); return (n >>> 0) / 4294967296; }
