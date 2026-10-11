import type { Balances, Candle, OrderBook } from '@shaman/shared';

// SAMPLE DATA for the gold exchange prototype. There is no server market; prices are generated from a fixed seed so
// screenshots and tests are repeatable. Not an economic design.

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function series(count: number, stepMs: number, start: number, volatility: number, seed: number): Candle[] {
  const r = rng(seed);
  const end = Date.UTC(2026, 9, 9, 12);
  const out: Candle[] = [];
  let price = start;
  for (let i = 0; i < count; i++) {
    const o = price;
    const c = Math.max(100, Math.round(o + (r() - 0.48) * volatility));
    const h = Math.max(o, c) + Math.round(r() * volatility * 0.5);
    const l = Math.min(o, c) - Math.round(r() * volatility * 0.5);
    out.push({ t: end - (count - 1 - i) * stepMs, o, h, l, c, v: Math.round(20 + r() * 180) });
    price = c;
  }
  return out;
}

export const SAMPLE_CANDLES = {
  hour: series(48, 3_600_000, 140, 4, 7),
  day: series(30, 86_400_000, 120, 9, 11),
} as const;
export type CandleRange = keyof typeof SAMPLE_CANDLES;

const last = SAMPLE_CANDLES.hour[SAMPLE_CANDLES.hour.length - 1]!.c;
const r = rng(23);
export const SAMPLE_BOOK: OrderBook = {
  asks: Array.from({ length: 8 }, (_, i) => ({ price: last + 1 + i, qty: Math.round(3 + r() * 40) })),
  bids: Array.from({ length: 8 }, (_, i) => ({ price: last - 1 - i, qty: Math.round(3 + r() * 40) })),
};

export const SAMPLE_BALANCES: Balances = { gold: 120, silver: 18_250 };
