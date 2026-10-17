'use client';
import { useEffect, useState } from 'react';
import { DEFAULT_HEAD, HAIRSTYLES, HAIR_COLORS, EXPRESSIONS, SSR_DIRECTIONS, type HairstyleId, type HeadAppearance } from '@shaman/shared';
import { useHeadStore } from '@/stores/head-store';
import { AppearancePreview, loadAppearanceAssets, type AppearanceAssets } from './AppearanceWindow';
import { SSR_HAIR, SSR_FACES } from '@/game/characters/ssr-head-config';
import './creator.css';

const drafts = [
  ['plain-short','ผมสั้นธรรมดา'], ['medium-part','ผมกลางแสกข้าง'], ['long-pony','ผมยาวมัดหาง'],
  ['round-bun','ผมรวบมวย'], ['wild-layer','ผมยุ่งเท่ ๆ'], ['eye-sweep','ผมปัดยาวปิดตา'],
  ['loose-long','ผมยาวปล่อย'], ['ritual-tuft','ผมทรงจุก'],
] as const;

export function CharacterCreator({ onEnter }: { onEnter?: () => void }) {
  const [head, setHead] = useState<HeadAppearance>(DEFAULT_HEAD);
  const [assets, setAssets] = useState<AppearanceAssets | null>(null);
  const [error, setError] = useState('');
  const [turn, setTurn] = useState(0);
  const [draft, setDraft] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [mode, setMode] = useState<'select' | 'create'>('create');
  const [hasCharacter, setHasCharacter] = useState(false);
  const facing = SSR_DIRECTIONS[(turn % 8 + 8) % 8]!;
  useEffect(() => {
    setHead(useHeadStore.getState().head);
    try {
      const exists = localStorage.getItem('shaman.character.created.v1') === 'yes';
      setHasCharacter(exists);
      if (exists) setMode('select');
    } catch { /* no persistent storage */ }
    let active = true;
    loadAppearanceAssets().then(a => {
      if (!a.ssr) throw Error('โหลดชุดตัวละครใหม่ไม่ครบ กรุณาลองอีกครั้ง');
      if (active) setAssets(a);
    }).catch(e => { if (active) setError(String(e.message)); });
    return () => { active = false; };
  }, []);
  function enter() {
    if (!assets || draft || entering) return;
    setEntering(true);
    useHeadStore.getState().setHead(head);
    try { localStorage.setItem('shaman.character.created.v1', 'yes'); } catch { /* session still works */ }
    if (onEnter) onEnter(); else window.location.assign('/');
  }
  const faces = SSR_HAIR[head.hair] ? EXPRESSIONS.filter(e => ['neutral','violet-sharp','teal-soft','cold-detached'].includes(e.id)) : EXPRESSIONS.filter(e => ['neutral','sad'].includes(e.id));
  return <main className={`cc-page cc-mode-${mode}`}>
    <div className="cc-atmosphere" aria-hidden="true"/>
    <header className="cc-header"><img className="cc-emblem" src="/assets/ui/v2/menu/class.png" width={64} height={64} alt=""/><div><span>PROJECT SHAMAN · SACRED TALISMAN</span><h1>{mode === 'select' ? 'เลือกตัวละคร' : 'สร้างตัวละคร'}</h1><p>เสียงเรียกจากโลกวิญญาณ รอผู้สืบทอดวิชาอาคม</p></div><nav aria-label="หน้าตัวละคร"><button aria-pressed={mode==='select'} disabled={!hasCharacter} onClick={()=>{setDraft(null);setHead(useHeadStore.getState().head);setMode('select');}}>เลือกตัวละคร</button><button aria-pressed={mode==='create'} onClick={()=>setMode('create')}>ปรับรูปลักษณ์</button></nav></header>
    <div className="cc-layout">
      <section className="cc-preview" aria-label="พรีวิวตัวละครจริง">
        <div className="cc-preview-title"><img src="/assets/ui/v2/ornament/medallion.png" width={25} height={31} alt=""/><span className="cc-kicker">ผู้เดินทางแห่งวิญญาณ</span><h2>ร่างทรงฝึกหัด</h2><span className="cc-class">MEDIUM · NOVICE</span></div>
        <div className="cc-stage">{error ? <p role="alert">{error}</p> : !assets ? <p role="status">กำลังโหลดตัวละครจริง…</p> : draft ? <img src={`/assets/ssr/candidates/hair-eight-prototypes-02/${draft}-white-body.png`} width={128} height={128} alt="ต้นแบบทรงผมด้านหน้า"/> : <AppearancePreview assets={assets} head={head} facing={facing}/>}</div>
        <div className="cc-turn"><button disabled={!!draft} onClick={() => setTurn(t => t - 1)} aria-label="หมุนซ้าย">↶</button><span>{draft ? 'ต้นแบบ · FRONT เท่านั้น' : facing}</span><button disabled={!!draft} onClick={() => setTurn(t => t + 1)} aria-label="หมุนขวา">↷</button></div>
        <p>{draft ? 'ต้นแบบด้านหน้า · ยังไม่พร้อมเข้าเกม' : 'หมุนชมตัวละครได้ทั้ง 8 ทิศ'}</p>
        <button className="cc-enter" disabled={!assets || !!error || !!draft || entering} onClick={enter}>{entering ? 'กำลังเข้าเกม…' : mode==='select' ? 'เข้าสู่โลกวิญญาณ' : 'ยืนยันรูปลักษณ์และเข้าเกม'}</button>
        <small>จำรูปลักษณ์ในเบราว์เซอร์นี้ · เปลี่ยนภายหลังได้ด้วยปุ่ม V</small>
      </section>
      <section className="cc-choices">
        {mode==='select' ? <div className="cc-selection"><span className="cc-section-label">บันทึกผู้เดินทาง</span><h2>ตัวละครของคุณ</h2><p>รูปลักษณ์ที่จำไว้ในเบราว์เซอร์นี้</p><button className="cc-character-card" aria-pressed="true" onClick={()=>setDraft(null)}>{assets && <AppearancePreview assets={assets} head={head} facing="south"/>}<span><b>ร่างทรงฝึกหัด</b><small>MEDIUM</small><em>{HAIRSTYLES.find(h=>h.id===head.hair)?.th}</em></span><span className="cc-chosen">เลือกแล้ว</span></button><div className="cc-summary"><div><span>ทรงผม</span><b>{HAIRSTYLES.find(h=>h.id===head.hair)?.th}</b></div><div><span>สีผม</span><b>{HAIR_COLORS.find(c=>c.id===head.hairColor)?.th}</b></div><div><span>ใบหน้า</span><b>{EXPRESSIONS.find(f=>f.id===head.face)?.th}</b></div></div><button className="cc-edit" onClick={()=>setMode('create')}>ปรับรูปลักษณ์ตัวละคร</button><p className="cc-storage-note">บันทึกเฉพาะรูปลักษณ์ · ความคืบหน้าเกมใช้ระบบเซสชันปัจจุบัน</p></div> : <>
        <div className="cc-choice-heading"><span className="cc-section-label">จารึกตัวตน</span><h2>เลือกรูปลักษณ์ของคุณ</h2><p>ทรงผม สี และใบหน้าที่จะปรากฏในโลกจริง</p></div>
        <fieldset><legend>ทรงผม <small>{HAIRSTYLES.length} ทรงพร้อมเล่น</small></legend><div className="cc-hairs">{HAIRSTYLES.map(h => <button key={h.id} aria-pressed={!draft && head.hair === h.id} onClick={() => { setDraft(null); setHead(v => ({ ...v, hair:h.id as HairstyleId, face: SSR_HAIR[h.id] ? v.face : 'neutral' })); }}>{assets && <AppearancePreview assets={assets} head={{...head,hair:h.id,face:'neutral'}} facing="south"/>}<span>{h.th}</span></button>)}</div></fieldset>
        <fieldset><legend>สีผม</legend><div className="cc-colors">{HAIR_COLORS.map(c => <button key={c.id} disabled={!!draft} aria-label={c.th} title={c.th} aria-pressed={head.hairColor === c.id} onClick={() => setHead(v => ({...v,hairColor:c.id}))}><i style={{background:assets?.ssr?.palettes[c.id]?.[5] ?? '#'+c.tint.toString(16).padStart(6,'0')}}/>{c.th}</button>)}</div></fieldset>
        <fieldset><legend>ใบหน้า</legend><div className="cc-faces">{faces.map(f => <button key={f.id} disabled={!!draft} aria-pressed={head.face === f.id} onClick={() => setHead(v => ({...v,face:f.id}))}>{f.th}</button>)}</div></fieldset>
        <details><summary>ดูต้นแบบอีก 8 ทรง · ยังไม่ครบทุกทิศ</summary><div className="cc-hairs">{drafts.map(([id,name]) => <button key={id} aria-pressed={draft===id} onClick={() => setDraft(id)}><img loading="lazy" src={`/assets/ssr/candidates/hair-eight-prototypes-02/${id}-white-head.png`} width={128} height={128} alt={name}/><span>{name}</span><small>FRONT</small></button>)}</div></details>
        </>}
      </section>
    </div>
    <footer className="cc-footer"><span>นครมนตร์ทมิฬ</span><i aria-hidden="true">◆</i><span>UMBRAL CAPITAL</span></footer>
  </main>;
}
