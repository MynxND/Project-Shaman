import type { NpcDefinition } from '../npc.js';

// Umbral Capital town NPCs (2026-10-09). Names, lines and services are PROVISIONAL. Each stands at the spot reserved
// for it in docs/design/UMBRAL_CAPITAL_REDESIGN.md, beside (not in front of) the building it serves.
export const UMBRAL_NPCS: NpcDefinition[] = [
  { id: 'guide', sprite: 'npc-guide', role: 'guide', x: 42.8, y: 38.8, name: { th: 'นวลจันทร์', en: 'Nuanchan' }, title: 'ผู้นำทางเมือง',
    greeting: 'ยินดีต้อนรับสู่นครมนตร์ทมิฬ ผู้เดินทาง! ถ้าหลงทาง ถามข้าได้เสมอ' },
  { id: 'keeper', sprite: 'npc-keeper', role: 'save', x: 37.0, y: 33.8, name: { th: 'แม่ศรีเรือน', en: 'Mae Si Ruean' }, title: 'ผู้ดูแลศาลหลักเมือง',
    greeting: 'เสาหลักเมืองคุ้มครองทุกดวงวิญญาณที่ผูกพันกับที่นี่ จะให้ข้าบันทึกจุดกลับมาของเจ้าไหม' },
  { id: 'elder', sprite: 'npc-elder', role: 'quest', x: 44.6, y: 19.6, name: { th: 'หลวงตาธรรม', en: 'Luang Ta Tham' }, title: 'พระอาจารย์แห่งวิหาร',
    greeting: 'วิญญาณมืดเริ่มกระสับกระส่าย ข้าต้องการร่างทรงที่ใจกล้า เจ้าพร้อมหรือยัง' },
  { id: 'instructor', sprite: 'npc-instructor', role: 'trainer', x: 12.0, y: 35.6, name: { th: 'อาจารย์คง', en: 'Ajarn Khong' }, title: 'อาจารย์สอนคาถา',
    greeting: 'คาถาไม่ได้อยู่ที่ปาก แต่อยู่ที่ใจ ฝึกให้หนัก แล้วข้าจะสอนวิชาใหม่ให้' },
  { id: 'herbalist', sprite: 'npc-herbalist', role: 'shop-consumable', x: 53.6, y: 31.4, name: { th: 'ป้าบุญมี', en: 'Pa Bunmi' }, title: 'ร้านยาสมุนไพร',
    greeting: 'ยาต้มร้อนๆ มาแล้วจ้า แผลหาย พลังวิญญาณกลับมา ราคาเป็นกันเอง' },
  { id: 'talisman', sprite: 'npc-talisman', role: 'shop-equipment', x: 72.6, y: 31.4, name: { th: 'ช่างเพียร', en: 'Chang Phian' }, title: 'ร้านเครื่องรางและอาวุธ',
    greeting: 'ยันต์ทุกแผ่นข้าเขียนเอง เครื่องรางทุกชิ้นปลุกเสกเต็มพิธี เลือกดูได้เลย' },
  { id: 'trader', sprite: 'npc-trader', role: 'exchange', x: 64.6, y: 40.6, name: { th: 'เถ้าแก่ทอง', en: 'Thao Kae Thong' }, title: 'นายวาณิชแลกทอง',
    greeting: 'ทองขึ้น ทองลง ข้ารู้หมด อยากซื้อขายทองก็มาที่ข้า' },
  { id: 'storage', sprite: 'npc-storage', role: 'storage', x: 52.6, y: 36.4, name: { th: 'ลุงมั่น', en: 'Lung Man' }, title: 'ผู้ดูแลคลังสินค้า',
    greeting: 'ของหนักเกินแบกไหว ฝากไว้กับข้าได้ คลังของข้าไม่เคยมีของหาย' },
  { id: 'smith', sprite: 'npc-smith', role: 'refine', x: 60.6, y: 25.2, name: { th: 'ช่างเหล็กอินทร์', en: 'Chang In' }, title: 'ช่างหลอมและลงอาคม',
    greeting: 'อาวุธดีต้องผ่านไฟและอาคม เอามาให้ข้า แล้วจะคมกว่าเดิม' },
  { id: 'teleporter', sprite: 'npc-teleporter', role: 'teleport', x: 46.6, y: 53.4, name: { th: 'แม่มดเรไร', en: 'Rerai' }, title: 'ร่างทรงนำทางวิญญาณ',
    greeting: 'วิญญาณนำทางจะพาเจ้าไปได้ทุกที่ที่เคยเหยียบ บอกข้ามาว่าจะไปไหน' },
  { id: 'guard', sprite: 'npc-guard', role: 'guard', x: 34.4, y: 51.4, name: { th: 'พลทหารเสือ', en: 'Guard Suea' }, title: 'ทหารรักษาประตู',
    greeting: 'นอกกำแพงมีภูตผีเร่ร่อน ออกไปก็ระวังตัวด้วย' },
];
