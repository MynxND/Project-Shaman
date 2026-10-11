// Behavioural checks for the provisional gold exchange rules. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { bestPrices, consumeBook, cumulativeDepth, marketFee, quoteMarket, quoteOrder, settleFill, validateOrder } from '../dist/index.js';

const book = { bids: [{ price: 150, qty: 5 }, { price: 148, qty: 10 }], asks: [{ price: 152, qty: 3 }, { price: 155, qty: 4 }] };
assert.deepEqual(bestPrices(book), { bid: 150, ask: 152, spread: 2 });
assert.deepEqual(cumulativeDepth(book.asks).map((l) => l.total), [3, 7]);
const q = quoteMarket(book, 'buy', 5);
assert.deepEqual([q.filled, q.value, q.remaining], [5, 3 * 152 + 2 * 155, 0]);
assert.equal(quoteMarket(book, 'sell', 20).remaining, 5, 'sell beyond the bids leaves a remainder');
assert.equal(marketFee(1001), 11, 'fee rounds up');
assert.deepEqual(quoteOrder(book, { side: 'buy', type: 'limit', qty: 2, price: 100 }), { value: 200, fee: 2, avgPrice: 100, remaining: 0 });

const rich = { gold: 10, silver: 100000 };
assert.equal(validateOrder(book, { side: 'buy', type: 'market', qty: 0 }, rich), 'qty-invalid');
assert.equal(validateOrder(book, { side: 'buy', type: 'market', qty: 1.5 }, rich), 'qty-invalid');
assert.equal(validateOrder(book, { side: 'buy', type: 'limit', qty: 1, price: 0 }, rich), 'price-invalid');
assert.equal(validateOrder(book, { side: 'buy', type: 'market', qty: 8 }, rich), 'no-liquidity');
assert.equal(validateOrder(book, { side: 'buy', type: 'market', qty: 3 }, { gold: 0, silver: 456 }), 'insufficient-silver', 'fee must be covered');
assert.equal(validateOrder(book, { side: 'buy', type: 'market', qty: 3 }, { gold: 0, silver: 461 }), null);
assert.equal(validateOrder(book, { side: 'sell', type: 'limit', qty: 11, price: 150 }, rich), 'insufficient-gold');
assert.equal(validateOrder(book, { side: 'sell', type: 'market', qty: 5 }, rich), null);
assert.equal(validateOrder(book, { side: 'sell', type: 'market', qty: 5 }, { gold: 5, silver: 0 }), null, 'market sell fee comes from proceeds');
assert.equal(validateOrder(book, { side: 'sell', type: 'limit', qty: 5, price: 150 }, { gold: 5, silver: 0 }), 'insufficient-silver', 'limit sell reserves the fee');

assert.deepEqual(settleFill({ gold: 1, silver: 1000 }, 'buy', 2, 304, 4), { gold: 3, silver: 692 });
assert.deepEqual(settleFill({ gold: 3, silver: 0 }, 'sell', 2, 300, 3), { gold: 1, silver: 297 });
const after = consumeBook(book, 'buy', 5);
assert.deepEqual(after.asks, [{ price: 155, qty: 2 }]);
assert.equal(book.asks.length, 2, 'original book is not mutated');
console.log('market helpers: ok');
