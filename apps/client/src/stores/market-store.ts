import { create } from 'zustand';
import { consumeBook, quoteOrder, settleFill, validateOrder, type Balances, type MarketSide, type OrderBook, type OrderType } from '@shaman/shared';
import { SAMPLE_BALANCES, SAMPLE_BOOK, type CandleRange } from '@/game-data/sample-market';

export interface MarketOrder {
  id: number; at: number; side: MarketSide; type: OrderType; qty: number; price: number | null;
  value: number; fee: number; status: 'filled' | 'open' | 'cancelled';
}

/** Form → review → done. The review step is the confirmation state; nothing is placed before it. */
export type FormStage = 'edit' | 'review' | 'done';

let nextId = 1;

/**
 * Gold exchange UI state plus a LOCAL simulation on sample data: market orders fill against the sample book and
 * change the sample balances in this browser only; limit orders rest as open (they reserve funds) until cancelled.
 * Nothing is sent to a server, and the window says so.
 */
interface MarketUi {
  open: boolean;
  range: CandleRange;
  side: MarketSide;
  type: OrderType;
  qty: string;
  price: string;
  stage: FormStage;
  book: OrderBook;
  balances: Balances;
  orders: MarketOrder[];
  historyTab: 'open' | 'history';
  toggle: () => void;
  close: () => void;
  setRange: (r: CandleRange) => void;
  setSide: (s: MarketSide) => void;
  setType: (t: OrderType) => void;
  setQty: (q: string) => void;
  setPrice: (p: string) => void;
  setHistoryTab: (t: 'open' | 'history') => void;
  review: () => void;
  back: () => void;
  confirm: () => MarketOrder | null;
  cancelOrder: (id: number) => void;
}

export const parseWhole = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s.trim()) : NaN);

export const useMarketStore = create<MarketUi>((set, get) => ({
  open: false, range: 'hour', side: 'buy', type: 'limit', qty: '1', price: String(SAMPLE_BOOK.asks[0]?.price ?? ''), stage: 'edit',
  book: SAMPLE_BOOK, balances: SAMPLE_BALANCES, orders: [], historyTab: 'open',
  toggle: () => set((s) => ({ open: !s.open, stage: 'edit' })),
  close: () => set({ open: false, stage: 'edit' }),
  setRange: (range) => set({ range }),
  setSide: (side) => set({ side, stage: 'edit' }),
  setType: (type) => set({ type, stage: 'edit' }),
  setQty: (qty) => set({ qty, stage: 'edit' }),
  setPrice: (price) => set({ price, stage: 'edit' }),
  setHistoryTab: (historyTab) => set({ historyTab }),
  review: () => set({ stage: 'review' }),
  back: () => set({ stage: 'edit' }),
  confirm: () => {
    const s = get();
    const draft = { side: s.side, type: s.type, qty: parseWhole(s.qty), price: s.type === 'limit' ? parseWhole(s.price) : undefined };
    if (validateOrder(s.book, draft, s.balances)) { set({ stage: 'edit' }); return null; }
    const q = quoteOrder(s.book, draft);
    const base = { id: nextId++, at: Date.now(), side: draft.side, type: draft.type, qty: draft.qty, value: q.value, fee: q.fee };
    if (draft.type === 'market') {
      const order: MarketOrder = { ...base, price: q.avgPrice, status: 'filled' };
      set({ book: consumeBook(s.book, draft.side, draft.qty), balances: settleFill(s.balances, draft.side, draft.qty, q.value, q.fee), orders: [order, ...s.orders], stage: 'done', historyTab: 'history' });
      return order;
    }
    // Limit orders do not match in this simulation; they reserve what they would spend until cancelled.
    const order: MarketOrder = { ...base, price: draft.price ?? null, status: 'open' };
    const balances = draft.side === 'buy'
      ? { ...s.balances, silver: s.balances.silver - q.value - q.fee }
      : { gold: s.balances.gold - draft.qty, silver: s.balances.silver - q.fee };
    set({ balances, orders: [order, ...s.orders], stage: 'done', historyTab: 'open' });
    return order;
  },
  cancelOrder: (id) => set((s) => {
    const o = s.orders.find((x) => x.id === id && x.status === 'open');
    if (!o) return {};
    // Release the reservation (fee included: nothing was traded).
    const balances = o.side === 'buy'
      ? { ...s.balances, silver: s.balances.silver + o.value + o.fee }
      : { gold: s.balances.gold + o.qty, silver: s.balances.silver + o.fee };
    return { balances, orders: s.orders.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)) };
  }),
}));
