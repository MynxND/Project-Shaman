import { FaceEightCandidates } from '@/components/character-v3/FaceEightCandidates';
import { FaceStyleCandidates } from '@/components/character-v3/FaceStyleCandidates';
import { ExtraEightDesigns } from '@/components/character-v3/ExtraEightDesigns';
import { ExtraFrontDesigns } from '@/components/character-v3/ExtraFrontDesigns';
import { KoreanWolfEightCandidate } from '@/components/character-v3/KoreanWolfEightCandidate';
import { KoreanWolfCandidate } from '@/components/character-v3/KoreanWolfCandidate';
import { EyeVeilEightCandidate } from '@/components/character-v3/EyeVeilEightCandidate';
import { EyeVeilCandidate } from '@/components/character-v3/EyeVeilCandidate';
import { FaceFitEightCandidate } from '@/components/character-v3/FaceFitEightCandidate';
import { FaceFitShortCandidate } from '@/components/character-v3/FaceFitShortCandidate';
import { KidCleanEightCandidate } from '@/components/character-v3/KidCleanEightCandidate';
import { HairEightPrototypes } from '@/components/character-v3/HairEightPrototypes';
import { KidStripeCandidate } from '@/components/character-v3/KidStripeCandidate';
import { HairEightCandidate } from '@/components/character-v3/HairEightCandidate';
import { HairFrontCandidate } from '@/components/character-v3/HairFrontCandidate';
import { EightDirectionBodies } from '@/components/character-v3/EightDirectionBodies';
import { WalkEightInspector } from '@/components/character-v3/WalkEightInspector';
import { V3Comparison } from '@/components/character-v3/V3Comparison';
import { EightDirectionHeads } from '@/components/character-v3/EightDirectionHeads';
import { SeparatedRigInspector } from '@/components/character-v3/SeparatedRigInspector';

export default function Page() {
  return <><FaceEightCandidates /><FaceStyleCandidates /><ExtraEightDesigns /><ExtraFrontDesigns /><KoreanWolfEightCandidate /><KoreanWolfCandidate /><EyeVeilEightCandidate /><FaceFitEightCandidate /><EyeVeilCandidate /><FaceFitShortCandidate /><KidCleanEightCandidate /><HairEightPrototypes /><details><summary>Kid Stripe · ไม่ผ่านการตรวจภาพ · ประวัติเท่านั้น</summary><KidStripeCandidate /></details><HairEightCandidate /><details><summary>FRONT ที่อนุมัติ · ภาพเปรียบเทียบเดิม</summary><HairFrontCandidate /></details><WalkEightInspector /><EightDirectionBodies /><EightDirectionHeads /><SeparatedRigInspector /><details><summary>ประวัติ V3 ตัวเล็กที่ไม่ตรงรูปลักษณ์เดิม · เก็บไว้ ไม่ใช้เป็นฐาน</summary><p>ภาพรอบก่อนใช้เพิ่ม 15 เครดิต ไม่ใช่งบรอบนี้</p><a href="/assets/character-v3/separated-front-01/body.png">Body-only เดิม</a> · <a href="/assets/character-v3/separated-front-01/head-a.png">หัวเดิม</a></details><details><summary>ประวัติ V3 proportion candidates · ไม่ใช่ rig ใหม่</summary><V3Comparison /></details></>;
}




