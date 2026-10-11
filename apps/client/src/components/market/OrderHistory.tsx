import { Button } from '@/components/ui-kit';
import { useMarketStore, type MarketOrder } from '@/stores/market-store';

const STATUS_TH: Record<MarketOrder['status'], string> = { filled: 'สำเร็จ', open: 'รอจับคู่', cancelled: 'ยกเลิก' };
const time = (at: number) => new Date(at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Orders placed in this session (local simulation). */
export function OrderHistory() {
  const { orders, historyTab, setHistoryTab, cancelOrder } = useMarketStore();
  const list = orders.filter((o) => (historyTab === 'open' ? o.status === 'open' : o.status !== 'open'));
  return (
    <section className="sk-frame-10 sk-panel mk-history" aria-label="คำสั่งของฉัน">
      <header className="mk-panel-head">
        <h4>คำสั่งของฉัน</h4>
        <div className="mk-seg" role="tablist" aria-label="รายการคำสั่ง">
          <button type="button" role="tab" className="mk-tab" aria-selected={historyTab === 'open'} onClick={() => setHistoryTab('open')}>เปิดอยู่ ({orders.filter((o) => o.status === 'open').length})</button>
          <button type="button" role="tab" className="mk-tab" aria-selected={historyTab === 'history'} onClick={() => setHistoryTab('history')}>ประวัติ</button>
        </div>
      </header>
      {list.length === 0
        ? <p className="sk-muted mk-empty">{historyTab === 'open' ? 'ไม่มีคำสั่งที่รอจับคู่' : 'ยังไม่มีประวัติในรอบนี้'}</p>
        : <div className="mk-table-wrap"><table className="mk-table">
            <thead><tr><th>เวลา</th><th>ฝั่ง</th><th>ประเภท</th><th>ราคา</th><th>จำนวน</th><th>มูลค่า</th><th>สถานะ</th>{historyTab === 'open' && <th />}</tr></thead>
            <tbody>{list.map((o) => (
              <tr key={o.id}>
                <td>{time(o.at)}</td>
                <td className={o.side === 'buy' ? 'sk-up' : 'sk-down'}>{o.side === 'buy' ? 'ซื้อ' : 'ขาย'}</td>
                <td>{o.type === 'limit' ? 'กำหนดราคา' : 'ตลาด'}</td>
                <td>{o.price !== null ? (o.type === 'market' ? o.price.toFixed(1) : o.price) : '—'}</td>
                <td>{o.qty}</td>
                <td>{o.value.toLocaleString()}</td>
                <td>{STATUS_TH[o.status]}</td>
                {historyTab === 'open' && <td><Button variant="danger" onClick={() => cancelOrder(o.id)}>ยกเลิก</Button></td>}
              </tr>
            ))}</tbody>
          </table></div>}
    </section>
  );
}
