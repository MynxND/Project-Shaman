import { jobTitle } from '@/game-data/skill-catalog';
import { expToNext } from '@shaman/shared';
import { ProgressBar } from '@/components/ui-kit';
import { SAMPLE_CLASS_PATH } from '@/game-data/sample-character';
import { useCharacterStore } from '@/stores/character-store';
import { useMarketStore } from '@/stores/market-store';
import { useSessionStore } from '@/stores/session-store';
import { useProfileStore } from '@/stores/profile-store';
import { usePlayerName } from '@/stores/account-store';
import { openCharacter } from './windows';
import { PlayerPortrait } from '@/components/character/PlayerPortrait';

const STATUS_TH = { offline: 'ออฟไลน์', connecting: 'กำลังเชื่อมต่อ…', connected: 'ออนไลน์', disconnected: 'เชื่อมต่อไม่ได้' } as const;

/** Portrait, level, HP/SP/EXP and currency: the server profile while connected, the sample sheet offline. */
export function StatusPanel() {
  const s = useCharacterStore((st) => st.sheet);
  const status = useSessionStore((st) => st.status);
  const sampleSilver = useMarketStore((st) => st.balances.silver);
  const profile = useProfileStore((st) => st.profile);
  const name = usePlayerName();
  const silver = profile?.silver ?? sampleSilver;
  const level = profile?.level ?? s.baseLevel;
  const expPct = profile ? (profile.exp / expToNext(profile.level)) * 100 : (s.baseExp.current / s.baseExp.next) * 100;
  return (
    <section className="hud-panel hud-status pointer-events-auto" aria-label="สถานะตัวละคร">
      <button type="button" className="hud-portrait" onClick={openCharacter} title="เปิดบันทึกวิญญาณ (C)" aria-label="เปิดข้อมูลตัวละคร">
        {/* Head and shoulders in the arch's opening, then the carved portrait arch (UI kit v2) on top. */}
        <span className="hud-portrait-window"><PlayerPortrait /></span>
        <img className="hud-portrait-frame sk-pixel" src="/assets/ui/v2/frame/portrait-crop.png" alt="" width={62} height={94} />
        <span className="hud-portrait-lv">{level}</span>
      </button>
      <div className="hud-status-body">
        <h2>{profile ? name : s.name}</h2>
        <div className="hud-status-sub">Lv. {level} {profile ? `${jobTitle(profile).th} · Job ${profile.jobLevel}` : `${SAMPLE_CLASS_PATH.current.en} · Job ${s.jobLevel}`}</div>
        <div className="hud-bar-row"><span>HP</span><ProgressBar label="HP" value={profile?.hp ?? s.hp.current} max={profile?.hpMax ?? s.hp.max} color="var(--sk-crimson)" /></div>
        <div className="hud-bar-row"><span>SP</span><ProgressBar label="SP" value={profile?.sp ?? s.sp.current} max={profile?.spMax ?? s.sp.max} color="var(--sk-jade)" /></div>
        <div className="hud-exp" role="progressbar" aria-label="Base EXP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(expPct)}>
          <span style={{ width: `${expPct}%` }} /><em>EXP {expPct.toFixed(1)}%</em>
        </div>
        <div className="hud-status-foot">
          <span className="hud-coin" title={profile ? 'เงิน Silver' : 'เงิน Silver (ตัวอย่าง)'}>◉ {silver.toLocaleString()}</span>
          <span className="hud-conn" data-status={status}><i />{STATUS_TH[status]}</span>
        </div>
        {!profile && <div className="hud-sample">ค่าตัวอย่าง · ยังไม่เชื่อมตัวละคร</div>}
      </div>
    </section>
  );
}
