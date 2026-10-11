// Shared by the review panels: avoid hundreds of simultaneous asset requests on page load.
let active = 0;
const pending: (() => void)[] = [];
export async function hairPreviewFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
 await new Promise<void>(resolve => {if (active < 12) {active++; resolve();} else pending.push(resolve);});
 try {
  init?.signal?.throwIfAborted();
  const response = await fetch(input, init);
  const bytes = await response.arrayBuffer();
  return new Response(bytes, {status: response.status, statusText: response.statusText, headers: response.headers});
 } finally {
  const next = pending.shift();
  if (next) next(); else active--;
 }
}
/** Verify additive white PNGs without changing approved source manifests or approval receipts. */
export async function verifyWhiteHairPreview(root: string, signal: AbortSignal) {
 const r = await hairPreviewFetch(root + 'white-manifest.json', {signal, cache: 'no-store'});
 if (!r.ok) throw Error('โหลดพาเลตผมขาวไม่ได้');
 const m = await r.json() as {version: string; files: {id: string; url: string; sha256: string}[]};
 if (m.version !== 'white-hair-preview/1' || !m.files.length) throw Error('ข้อมูลผมขาวไม่ถูกต้อง');
 await Promise.all(m.files.map(async f => {
  if (!f.id.includes('white') || f.url !== root + f.id + '.png' || !/^[a-f0-9]{64}$/.test(f.sha256)) throw Error('ข้อมูลภาพผมขาวไม่ถูกต้อง');
  const response = await hairPreviewFetch(f.url, {signal});
  if (!response.ok) throw Error('ภาพผมขาวหาย');
  const bytes = await response.arrayBuffer();
  const actual = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
  if (actual !== f.sha256) throw Error('Hash ภาพผมขาวไม่ตรง');
 }));
}
