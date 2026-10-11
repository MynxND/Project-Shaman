import { bestPrices, cumulativeDepth, type BookLevel } from '@shaman/shared';
import { useMarketStore } from '@/stores/market-store';

function Rows({ levels, side, max, onPick }: { levels: (BookLevel & { total: number })[]; side: 'ask' | 'bid'; max: number; onPick: (p: number) => void }) {
  return (
    <>
      {levels.map((l) => (
        <button key={l.price} type="button" className="mk-level" data-side={side} onClick={() => onPick(l.price)} title="ใช้ราคานี้ในฟอร์ม">
          <span className="mk-depth" style={{ width: `${(l.total / max) * 100}%` }} />
          <span>{l.price.toLocaleString()}</span><span>{l.qty}</span><span>{l.total}</span>
        </button>
      ))}
    </>
  );
}

/** Market depth: asks above the spread (highest first), bids below. Clicking a level copies its price to the form. */
export function OrderBookPanel() {
  const book = useMarketStore((s) => s.book);
  const setPrice = useMarketStore((s) => s.setPrice);
  const setType = useMarketStore((s) => s.setType);
  const asks = cumulativeDepth(book.asks.slice(0, 6));
  const bids = cumulativeDepth(book.bids.slice(0, 6));
  const max = Math.max(asks.at(-1)?.total ?? 0, bids.at(-1)?.total ?? 0, 1);
  const { bid, ask, spread } = bestPrices(book);
  const pick = (p: number) => { setType('limit'); setPrice(String(p)); };
  return (
    <section className="sk-frame-10 sk-panel mk-book" aria-label="ความลึกตลาด">
      <h4>ความลึกตลาด <small className="sk-muted">Depth</small></h4>
      <div className="mk-level mk-level-head"><span>ราคา</span><span>จำนวน</span><span>สะสม</span></div>
      <div className="mk-levels"><Rows levels={[...asks].reverse()} side="ask" max={max} onPick={pick} /></div>
      <div className="mk-spread">
        {bid !== null && ask !== null ? <>ซื้อสูงสุด <b className="sk-up">{bid}</b> · ขายต่ำสุด <b className="sk-down">{ask}</b> · ส่วนต่าง {spread}</> : 'ไม่มีคำสั่งฝั่งตรงข้าม'}
      </div>
      <div className="mk-levels"><Rows levels={bids} side="bid" max={max} onPick={pick} /></div>
    </section>
  );
}
