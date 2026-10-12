// Player-facing skill text (Ragnarok-style): the catalogue formula with every "Lv" expression worked out for one skill
// level, and stat multipliers shown as percentages ("MATK × (1.0 + Lv × 0.2)" at Lv 2 → "140% MATK"). Design data
// stays in the catalogues; this only rewrites the display string.

const ELEMENT_TH: Readonly<Record<string, string>> = {
  Water: 'น้ำ', Fire: 'ไฟ', Wind: 'ลม', Earth: 'ดิน', Holy: 'ศักดิ์สิทธิ์', Shadow: 'มืด', Dark: 'มืด', Ghost: 'วิญญาณ',
  Poison: 'พิษ', Neutral: 'ไร้ธาตุ', Undead: 'อมตะ', Wood: 'ไม้', Metal: 'โลหะ', Ice: 'น้ำแข็ง', Lightning: 'สายฟ้า',
};

/** Element named in a formula, e.g. "MDMG (Water) = …" → { en: 'Water', th: 'น้ำ' }. */
export function skillElement(formula: string): { en: string; th: string } | null {
  const m = /DMG\s*\((\w+)\)/.exec(formula);
  return m && ELEMENT_TH[m[1]!] ? { en: m[1]!, th: ELEMENT_TH[m[1]!]! } : null;
}

type Tok = { k: 'n'; v: number } | { k: 'op'; v: string };
/** Evaluates "+ - × ÷ ( )" over numbers (Lv already substituted). Returns null when the text is not an expression. */
function evaluate(src: string): number | null {
  const toks: Tok[] = [];
  const re = /\s*(\d+(?:\.\d+)?|[()×÷+\-*/])/y;
  let m: RegExpExecArray | null;
  let at = 0;
  while (at < src.length && (re.lastIndex = at, m = re.exec(src))) { toks.push(/\d/.test(m[1]!) ? { k: 'n', v: Number(m[1]) } : { k: 'op', v: m[1]! }); at = re.lastIndex; }
  if (src.slice(at).trim()) return null;
  let i = 0;
  const peek = () => toks[i];
  const atom = (): number | null => {
    const t = toks[i++];
    if (!t) return null;
    if (t.k === 'n') return t.v;
    if (t.v === '(') { const v = sum(); if (toks[i]?.v !== ')') return null; i++; return v; }
    if (t.v === '-') { const v = atom(); return v == null ? null : -v; }
    if (t.v === '+') return atom();
    return null;
  };
  const product = (): number | null => {
    let v = atom();
    while (v != null && peek()?.k === 'op' && ['×', '÷', '*', '/'].includes(peek()!.v as string)) {
      const op = toks[i++]!.v; const r = atom(); if (r == null) return null;
      v = op === '×' || op === '*' ? v * r : v / r;
    }
    return v;
  };
  const sum = (): number | null => {
    let v = product();
    while (v != null && peek()?.k === 'op' && (peek()!.v === '+' || peek()!.v === '-')) {
      const op = toks[i++]!.v; const r = product(); if (r == null) return null;
      v = op === '+' ? v + r : v - r;
    }
    return v;
  };
  const out = sum();
  return out != null && i === toks.length && Number.isFinite(out) ? out : null;
}

const num = (v: number) => String(Math.round(v * 100) / 100);

// An arithmetic span: numbers (optionally %) or "Lv" joined by operators. "Lv3" (a level label) is not a term.
const TERM = String.raw`(?:\d[\d,]*(?:\.\d+)?%?|Lv(?!\d))`;
const OP = String.raw`\s*[×÷+\-]\s*`;
const SPAN = new RegExp(String.raw`[+]?${TERM}(?:${OP}${TERM})+`, 'g');

/** Evaluates one arithmetic span ("20% + Lv × 3%", "1 + Lv ÷ 3") for a level; null if it is not arithmetic. */
function solveSpan(body: string, lv: number): string | null {
  const sign = body.startsWith('+') ? '+' : '';
  const percent = body.includes('%');
  let v = evaluate(body.replace(/(\d),(\d{3})/g, '$1$2').replace(/%/g, '').replace(/Lv/g, `(${lv})`));
  if (v == null) return null;
  if (!percent && body.includes('÷')) v = Math.floor(v);
  return `${sign}${num(v)}${percent ? '%' : ''}`;
}

/** Works out every "Lv" expression in the formula text for one level. */
function solveLevels(text: string, lv: number): string {
  let s = text;
  // 1. Parenthesised groups with Lv: "(1.0 + Lv × 0.2)" → "1.4".
  s = s.replace(/\(([^()]*\bLv\b[^()]*)\)/g, (all, inner: string) => solveSpan(inner.trim(), lv) ?? all);
  // 2. "1 วินาที × Lv" → "3 วินาที".
  s = s.replace(/(\d[\d,]*(?:\.\d+)?)(%?)(\s*(?:วินาที|ช่อง|อย่าง))?\s*×\s*Lv\b(?!\d)/g, (_, n: string, pc: string, unit = '') => `${num(Number(n.replace(/,/g, '')) * lv)}${pc}${unit}`);
  // 3. Remaining arithmetic spans that mention Lv.
  s = s.replace(SPAN, (span) => /Lv/.test(span) ? solveSpan(span, lv) ?? span : span);
  // 4. Anything left ("Shield DEF × Lv") gets the level number.
  return s.replace(/×\s*Lv\b(?!\d)/g, `× ${lv}`).replace(/ต่อ Lv\b/g, 'ต่อเลเวล');
}

/** Formula text for a skill level, written for players: damage as % of ATK/MATK, Lv worked out, Thai labels. */
export function skillLevelText(formula: string, lv: number): string {
  let s = solveLevels(formula.replace(/−/g, '-'), Math.max(1, lv));
  // "MATK × 1.4" → "140% MATK" (also with no Lv: "ATK × 2.0" → "200% ATK").
  s = s.replace(/\b(M?ATK)\s*×\s*(\d+(?:\.\d+)?)(?![\d.])/g, (_, stat: string, n: string) => `${num(Number(n) * 100)}% ${stat}`);
  // "×1.3 ต่อ Undead" → "+30% ต่อ Undead".
  s = s.replace(/(^|[\s;·])×\s*(\d+(?:\.\d+)?)\s*(ต่อ|ใส่|กับ)/g, (_, a: string, n: string, w: string) => `${a}+${num((Number(n) - 1) * 100)}% ${w}`);
  // Damage labels.
  s = s.replace(/(Burst\s+)?([PM])DMG(\s*รวม)?(?:\s*\((\w+)\))?(\s*ต่อ\S+)?\s*=\s*/g, (_, burst: string | undefined, kind: string, total: string | undefined, el: string | undefined, per: string | undefined) =>
    `${kind === 'P' ? 'ดาเมจกายภาพ' : 'ดาเมจเวท'}${el && ELEMENT_TH[el] ? `ธาตุ${ELEMENT_TH[el]}` : ''}${total ? 'รวม' : ''}${burst ? 'ระเบิด' : ''}${per ?? ''} `);
  s = s.replace(/\bDOT\s*=\s*/g, 'ดาเมจต่อเนื่อง ');
  s = s.replace(/\b([PM])DMG\b/g, (_, k: string) => k === 'P' ? 'ดาเมจกายภาพ' : 'ดาเมจเวท');
  s = s.replace(/(ฮีล|Heal)\s*=\s*/g, 'ฟื้น HP ');
  return s.replace(/;\s*/g, ' · ').replace(/\s{2,}/g, ' ').trim();
}
