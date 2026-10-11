'use client';
import { useState } from 'react';
import type { Candle } from '@shaman/shared';
import { Button } from '@/components/ui-kit';
import { SAMPLE_CANDLES, type CandleRange } from '@/game-data/sample-market';
import { useMarketStore } from '@/stores/market-store';

const W = 600, H = 216, PAD_R = 50, PRICE_H = 164, VOL_TOP = 174;
const RANGES: readonly { id: CandleRange; th: string }[] = [{ id: 'hour', th: 'รายชั่วโมง' }, { id: 'day', th: 'รายวัน' }];

const label = (c: Candle, range: CandleRange) => new Date(c.t).toLocaleString('th-TH', range === 'hour'
  ? { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });

/** Candlestick chart of the Gold price in Silver, drawn as SVG (scales with the panel, no chart library). */
export function PriceChart() {
  const range = useMarketStore((s) => s.range);
  const setRange = useMarketStore((s) => s.setRange);
  const candles = SAMPLE_CANDLES[range];
  const [hover, setHover] = useState<number | null>(null);
  const lo = Math.min(...candles.map((c) => c.l)), hi = Math.max(...candles.map((c) => c.h));
  const maxV = Math.max(...candles.map((c) => c.v));
  const plotW = W - PAD_R, step = plotW / candles.length, body = Math.max(2, step * 0.6);
  const y = (p: number) => 6 + (1 - (p - lo) / (hi - lo || 1)) * (PRICE_H - 12);
  const first = candles[0]!, last = candles[candles.length - 1]!;
  const shown = candles[hover ?? candles.length - 1]!;
  const change = ((last.c - first.o) / first.o) * 100;
  const ticks = [hi, (hi + lo) / 2, lo].map(Math.round);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    setHover(x < plotW ? Math.min(candles.length - 1, Math.max(0, Math.floor(x / step))) : null);
  };

  return (
    <section className="sk-frame-10 sk-panel mk-chart" aria-label="กราฟราคาทอง">
      <header className="mk-panel-head">
        <h4>ราคาทอง <small className="sk-muted">Gold / Silver</small></h4>
        <div className="mk-seg" role="group" aria-label="ช่วงเวลา">
          {RANGES.map((r) => <Button key={r.id} variant={range === r.id ? 'primary' : 'secondary'} aria-pressed={range === r.id} onClick={() => setRange(r.id)}>{r.th}</Button>)}
        </div>
      </header>
      <div className="mk-ohlc" aria-live="off">
        <b>{shown.c.toLocaleString()}</b>
        <span className={change >= 0 ? 'sk-up' : 'sk-down'}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</span>
        <span className="sk-muted">{label(shown, range)} · เปิด {shown.o} สูง {shown.h} ต่ำ {shown.l} ปิด {shown.c} · ปริมาณ {shown.v}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mk-svg" role="img" aria-label={`กราฟแท่งเทียน ${candles.length} ช่วง ราคาล่าสุด ${last.c} Silver`}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => <g key={t}><line x1={0} x2={plotW} y1={y(t)} y2={y(t)} className="mk-grid" /><text x={W - 2} y={y(t) + 4} className="mk-axis">{t}</text></g>)}
        <line x1={0} x2={plotW} y1={y(last.c)} y2={y(last.c)} className="mk-last" />
        {candles.map((c, i) => {
          const cx = i * step + step / 2, up = c.c >= c.o;
          return (
            <g key={c.t} className={up ? 'mk-up' : 'mk-down'} opacity={hover === null || hover === i ? 1 : 0.55}>
              <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} />
              <rect x={cx - body / 2} width={body} y={y(Math.max(c.o, c.c))} height={Math.max(1, Math.abs(y(c.o) - y(c.c)))} />
              <rect x={cx - body / 2} width={body} y={H - ((c.v / maxV) * (H - VOL_TOP))} height={(c.v / maxV) * (H - VOL_TOP)} className="mk-vol" />
            </g>
          );
        })}
        {hover !== null && <line x1={hover * step + step / 2} x2={hover * step + step / 2} y1={0} y2={H} className="mk-cross" />}
      </svg>
    </section>
  );
}
