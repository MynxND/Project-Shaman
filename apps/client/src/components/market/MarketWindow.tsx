'use client';
import { useEffect } from 'react';
import { Chip, Window } from '@/components/ui-kit';
import { useMarketStore } from '@/stores/market-store';
import { OrderBookPanel } from './OrderBookPanel';
import { OrderForm } from './OrderForm';
import { OrderHistory } from './OrderHistory';
import { PriceChart } from './PriceChart';
import './market.css';

/** Gold exchange. A local simulation on sample prices until the server owns currencies and a market. */
export function MarketWindow() {
  const close = useMarketStore((s) => s.close);
  const balances = useMarketStore((s) => s.balances);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  return (
    <Window labelId="market-title" className="mk-window sk-center-window pointer-events-auto" title="ตลาดแลกทอง" subtitle="Gold Exchange" onClose={close}
      icon={<img className="sk-pixel" src="/assets/ui/v2/menu/gold.png" alt="" width={40} height={40} />}
      actions={<>
        <Chip label="ยอด Gold" icon={<img className="sk-pixel" src="/assets/ui/v2/menu/gold.png" alt="" width={22} height={22} />}>{balances.gold.toLocaleString()}</Chip>
        <Chip label="ยอด Silver" icon={<span aria-hidden>◉</span>}>{balances.silver.toLocaleString()}</Chip>
        <span className="sk-sample-badge">จำลองในเครื่อง · ยังไม่เชื่อมเซิร์ฟเวอร์</span>
      </>}>
      <div className="mk-body">
        <PriceChart />
        <OrderBookPanel />
        <OrderForm />
        <OrderHistory />
      </div>
    </Window>
  );
}
