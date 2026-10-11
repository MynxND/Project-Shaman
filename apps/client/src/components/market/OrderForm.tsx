import { PROVISIONAL_MARKET_FEE, quoteOrder, validateOrder, type OrderError } from '@shaman/shared';
import { Button, NumberField } from '@/components/ui-kit';
import { useHudStore } from '@/stores/hud-store';
import { parseWhole, useMarketStore } from '@/stores/market-store';

const ERROR_TH: Record<OrderError, string> = {
  'qty-invalid': 'ใส่จำนวนทองเป็นจำนวนเต็มมากกว่า 0',
  'price-invalid': 'ใส่ราคาเป็นจำนวนเต็มมากกว่า 0',
  'no-liquidity': 'คำสั่งขายในตลาดไม่พอสำหรับจำนวนนี้',
  'insufficient-silver': 'Silver ไม่พอ (รวมค่าธรรมเนียม)',
  'insufficient-gold': 'Gold ไม่พอสำหรับจำนวนนี้',
};

/** Buy/sell form with a review (confirmation) step before anything changes. */
export function OrderForm() {
  const s = useMarketStore();
  const notify = useHudStore((st) => st.notify);
  const draft = { side: s.side, type: s.type, qty: parseWhole(s.qty), price: s.type === 'limit' ? parseWhole(s.price) : undefined };
  const error = validateOrder(s.book, draft, s.balances);
  const quote = error === 'qty-invalid' || error === 'price-invalid' ? null : quoteOrder(s.book, draft);
  const sideTh = s.side === 'buy' ? 'ซื้อ' : 'ขาย';
  const confirm = () => {
    const order = s.confirm();
    if (order) notify(order.status === 'filled'
      ? `${sideTh}ทอง ${order.qty} Gold สำเร็จ (จำลองในเครื่อง)`
      : `ตั้งคำสั่ง${sideTh} ${order.qty} Gold ที่ ${order.price} แล้ว (จำลองในเครื่อง)`, 'good');
  };

  return (
    <section className="sk-frame-10 sk-panel mk-form" aria-label="ฟอร์มซื้อขายทอง" data-side={s.side}>
      <div className="mk-side" role="tablist" aria-label="ฝั่ง">
        <button type="button" role="tab" aria-selected={s.side === 'buy'} data-side="buy" onClick={() => s.setSide('buy')}>ซื้อทอง</button>
        <button type="button" role="tab" aria-selected={s.side === 'sell'} data-side="sell" onClick={() => s.setSide('sell')}>ขายทอง</button>
      </div>
      <div className="mk-seg" role="group" aria-label="ประเภทคำสั่ง">
        <Button variant={s.type === 'limit' ? 'primary' : 'secondary'} aria-pressed={s.type === 'limit'} onClick={() => s.setType('limit')}>กำหนดราคา</Button>
        <Button variant={s.type === 'market' ? 'primary' : 'secondary'} aria-pressed={s.type === 'market'} onClick={() => s.setType('market')}>ราคาตลาด</Button>
      </div>
      <NumberField label="ราคา" unit="Silver" value={s.type === 'market' ? 'ตามตลาด' : s.price} disabled={s.type === 'market' || s.stage !== 'edit'}
        invalid={error === 'price-invalid'} onChange={s.setPrice} />
      <NumberField label="จำนวน" unit="Gold" value={s.qty} disabled={s.stage !== 'edit'} invalid={error === 'qty-invalid'} onChange={s.setQty} />
      <dl className="mk-quote">
        <dt>มูลค่า</dt><dd>{quote ? quote.value.toLocaleString() : '—'} Silver</dd>
        {s.type === 'market' && <><dt>ราคาเฉลี่ย</dt><dd>{quote?.avgPrice ? quote.avgPrice.toFixed(1) : '—'}</dd></>}
        <dt>ค่าธรรมเนียม {PROVISIONAL_MARKET_FEE * 100}%</dt><dd>{quote ? quote.fee.toLocaleString() : '—'} Silver</dd>
        <dt>{s.side === 'buy' ? 'จ่ายทั้งหมด' : 'ได้รับสุทธิ'}</dt>
        <dd><b>{quote ? (s.side === 'buy' ? quote.value + quote.fee : quote.value - quote.fee).toLocaleString() : '—'} Silver</b></dd>
      </dl>
      {error && <p className="mk-error" role="alert">{ERROR_TH[error]}</p>}

      {s.stage === 'edit' && <Button variant={s.side === 'buy' ? 'primary' : 'danger'} disabled={!!error} onClick={s.review}>ตรวจสอบคำสั่ง{sideTh}</Button>}
      {s.stage === 'review' && quote && (
        <div className="mk-review" role="alertdialog" aria-label="ยืนยันคำสั่ง">
          <p><b>ยืนยัน{sideTh} {draft.qty} Gold</b><br />
            {s.type === 'market' ? `ราคาตลาด เฉลี่ย ${quote.avgPrice?.toFixed(1)} Silver` : `ราคา ${draft.price} Silver ต่อ Gold`}<br />
            {s.side === 'buy' ? 'จ่าย' : 'ได้รับ'} {(s.side === 'buy' ? quote.value + quote.fee : quote.value - quote.fee).toLocaleString()} Silver (ค่าธรรมเนียม {quote.fee})</p>
          {s.type === 'limit' && <p className="sk-muted">คำสั่งกำหนดราคาจะรอจับคู่และกันเงินไว้ ยกเลิกได้ในแท็บคำสั่งที่เปิดอยู่</p>}
          <div className="mk-review-actions">
            <Button onClick={s.back}>แก้ไข</Button>
            <Button variant={s.side === 'buy' ? 'primary' : 'danger'} onClick={confirm}>ยืนยัน{sideTh}</Button>
          </div>
        </div>
      )}
      {s.stage === 'done' && (
        <div className="mk-done" role="status">
          <p>บันทึกคำสั่งแล้ว · จำลองในเครื่อง ไม่ได้ส่งไปเซิร์ฟเวอร์</p>
          <Button onClick={s.back}>สร้างคำสั่งใหม่</Button>
        </div>
      )}
    </section>
  );
}
