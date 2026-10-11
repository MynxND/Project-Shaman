// Gold exchange rules (Gold priced in Silver). PROVISIONAL: there is no server market, currency design or fee
// policy yet (docs/design-decisions.md). These helpers only describe how the UI quotes and validates orders so the
// rules can move to the server unchanged later.

export type MarketSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
/** One price level of the book: `qty` Gold available at `price` Silver each. */
export interface BookLevel { price: number; qty: number }
/** bids sorted high to low, asks sorted low to high. */
export interface OrderBook { bids: BookLevel[]; asks: BookLevel[] }
export interface Candle { t: number; o: number; h: number; l: number; c: number; v: number }
export interface Balances { gold: number; silver: number }
export interface OrderDraft { side: MarketSide; type: OrderType; qty: number; price?: number }

/** Provisional fee: 1% of the Silver value, paid in Silver on both sides, rounded up. */
export const PROVISIONAL_MARKET_FEE = 0.01;

export function bestPrices(book: OrderBook): { bid: number | null; ask: number | null; spread: number | null } {
  const bid = book.bids[0]?.price ?? null;
  const ask = book.asks[0]?.price ?? null;
  return { bid, ask, spread: bid !== null && ask !== null ? ask - bid : null };
}

/** Running total of quantity from the best price outward, for depth bars. */
export function cumulativeDepth(levels: readonly BookLevel[]): (BookLevel & { total: number })[] {
  let total = 0;
  return levels.map((l) => ({ ...l, total: (total += l.qty) }));
}

/** Walks the opposite side of the book for a market order: a buy takes asks, a sell takes bids. */
export function quoteMarket(book: OrderBook, side: MarketSide, qty: number): { filled: number; value: number; avgPrice: number | null; remaining: number } {
  const levels = side === 'buy' ? book.asks : book.bids;
  let left = qty, value = 0;
  for (const level of levels) {
    if (left <= 0) break;
    const take = Math.min(left, level.qty);
    value += take * level.price;
    left -= take;
  }
  const filled = qty - left;
  return { filled, value, avgPrice: filled > 0 ? value / filled : null, remaining: left };
}

export const marketFee = (value: number) => Math.ceil(value * PROVISIONAL_MARKET_FEE);

export type OrderError = 'qty-invalid' | 'price-invalid' | 'no-liquidity' | 'insufficient-silver' | 'insufficient-gold';

/** Silver value of an order: limit orders at their price, market orders at the book. */
export function quoteOrder(book: OrderBook, draft: OrderDraft): { value: number; fee: number; avgPrice: number | null; remaining: number } {
  if (draft.type === 'market') {
    const q = quoteMarket(book, draft.side, draft.qty);
    return { value: q.value, fee: marketFee(q.value), avgPrice: q.avgPrice, remaining: q.remaining };
  }
  const value = (draft.price ?? 0) * draft.qty;
  return { value, fee: marketFee(value), avgPrice: draft.price ?? null, remaining: 0 };
}

/** Whole Gold only; limit prices are whole Silver above zero; the account must cover Gold, Silver and the fee. */
export function validateOrder(book: OrderBook, draft: OrderDraft, balances: Balances): OrderError | null {
  if (!Number.isInteger(draft.qty) || draft.qty <= 0) return 'qty-invalid';
  if (draft.type === 'limit' && (!Number.isInteger(draft.price) || (draft.price ?? 0) <= 0)) return 'price-invalid';
  const q = quoteOrder(book, draft);
  if (q.remaining > 0) return 'no-liquidity';
  if (draft.side === 'buy') return balances.silver < q.value + q.fee ? 'insufficient-silver' : null;
  if (balances.gold < draft.qty) return 'insufficient-gold';
  // A market sell pays the fee out of its proceeds; a resting limit sell has no proceeds yet, so it needs the fee up front.
  return balances.silver + (draft.type === 'market' ? q.value : 0) < q.fee ? 'insufficient-silver' : null;
}

/** Balances after a fill of `qty` Gold for `value` Silver plus `fee`. */
export function settleFill(balances: Balances, side: MarketSide, qty: number, value: number, fee: number): Balances {
  return side === 'buy'
    ? { gold: balances.gold + qty, silver: balances.silver - value - fee }
    : { gold: balances.gold - qty, silver: balances.silver + value - fee };
}

/** Removes filled quantity from the side a market order consumed. */
export function consumeBook(book: OrderBook, side: MarketSide, qty: number): OrderBook {
  let left = qty;
  const eat = (levels: BookLevel[]) => levels.flatMap((l) => {
    const take = Math.min(left, l.qty);
    left -= take;
    return l.qty - take > 0 ? [{ ...l, qty: l.qty - take }] : [];
  });
  return side === 'buy' ? { bids: book.bids, asks: eat(book.asks) } : { bids: eat(book.bids), asks: book.asks };
}
