// Presentation randomness is independent of server/spawn/combat RNG.
export function terrainHash(mapId, x, y, seed = 31414) {
    let n = seed >>> 0;
    for (let i = 0; i < mapId.length; i++)
        n = Math.imul(n ^ mapId.charCodeAt(i), 16777619) >>> 0;
    n = Math.imul(n ^ (x | 0), 0x45d9f3b) >>> 0;
    n = Math.imul(n ^ (y | 0), 0x45d9f3b) >>> 0;
    n ^= n >>> 16;
    n = Math.imul(n, 0x7feb352d);
    n ^= n >>> 15;
    n = Math.imul(n, 0x846ca68b);
    n ^= n >>> 16;
    return n >>> 0;
}
export function weightedVariant(mapId, x, y, weights, seed = 31414) {
    const sum = weights.reduce((a, b) => a + Math.max(0, b), 0);
    if (!sum)
        return 0;
    let pick = terrainHash(mapId, x, y, seed) / 4294967296 * sum;
    for (let i = 0; i < weights.length; i++) {
        pick -= Math.max(0, weights[i]);
        if (pick < 0)
            return i;
    }
    return weights.length - 1;
}
// A shared two-pixel rim follows this phase regardless of interior variant.
export function terrainVariant(mapId, x, y, weights, seed = 31414) {
    return weightedVariant(mapId, x, y, weights, seed) * 16 + ((y % 4 + 4) % 4) * 4 + ((x % 4 + 4) % 4);
}
