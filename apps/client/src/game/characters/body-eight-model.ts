export const BODY_DIRECTIONS=['south','south-east','east','north-east','north','north-west','west','south-west'] as const;
export type NativePoint={x:number;y:number};
export type BodyEightFrame={index:number;direction:string;url:string;sha256:string;bodyOrigin:NativePoint;neckPivot:NativePoint;headPivot:NativePoint;headUrl:string;headSha256:string;fitNote:string};
export type BodyEightManifest={version:'body-eight/1';name:string;frames:BodyEightFrame[];visualApproved:false;headVisualApproved:true;animation:false;credits:{spent:number;cap:number};sheet:{url:string;sha256:string};reference:{url:string;sha256:string}};
const point=(p:NativePoint)=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<128&&p.y>=0&&p.y<128;
export const BODY_SETS=['body-eight-01','body-eight-02'] as const;
export type BodySetId=typeof BODY_SETS[number];
export function parseBodyEight(value:unknown,set:BodySetId='body-eight-01'):BodyEightManifest{
 const m=value as BodyEightManifest;
 if(!m||m.version!=='body-eight/1'||m.frames?.length!==8||m.visualApproved!==false||m.headVisualApproved!==true||m.animation!==false||!Number.isFinite(m.credits?.spent)||m.credits.spent<0||m.credits.spent>m.credits.cap)throw Error('ชุดตัวแปดทิศไม่ตรงสเปก');
 for(const[i,f]of m.frames.entries())if(f.index!==i||f.direction!==BODY_DIRECTIONS[i]||f.url!==`/assets/character-v3/${set}/${f.direction}.png`||f.headUrl!==`/assets/character-v3/head-eight-01/${f.direction}.png`||![f.sha256,f.headSha256].every(h=>/^[a-f0-9]{64}$/.test(h))||![f.bodyOrigin,f.neckPivot,f.headPivot].every(point))throw Error('ข้อมูลจุดยึดหรือเฟรมไม่ถูกต้อง');
 return m;
}
export function attachment(f:BodyEightFrame,offset:NativePoint={x:0,y:0}){
 return{body:{x:0,y:0},neck:{...f.neckPivot},head:{x:f.neckPivot.x-f.headPivot.x+Math.round(offset.x),y:f.neckPivot.y-f.headPivot.y+Math.round(offset.y)}};
}
