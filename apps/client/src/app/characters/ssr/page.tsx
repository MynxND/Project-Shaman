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
import { SsrPrototype } from '@/components/character-v3/SsrPrototype';

export default function Page() {
  return <><ExtraEightDesigns /><ExtraFrontDesigns /><KoreanWolfEightCandidate /><KoreanWolfCandidate /><EyeVeilEightCandidate /><FaceFitEightCandidate /><EyeVeilCandidate /><FaceFitShortCandidate /><KidCleanEightCandidate /><HairEightPrototypes /><details><summary>Kid Stripe · ไม่ผ่านการตรวจภาพ · ประวัติเท่านั้น</summary><KidStripeCandidate /></details><HairEightCandidate /><details><summary>FRONT ที่อนุมัติ · ภาพเปรียบเทียบเดิม</summary><HairFrontCandidate /></details><SsrPrototype /></>;
}

