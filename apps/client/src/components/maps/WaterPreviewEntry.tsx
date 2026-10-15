'use client';
import dynamic from 'next/dynamic';
const WaterPreview=dynamic(()=>import('./WaterPreview').then(m=>m.WaterPreview),{ssr:false,loading:()=> <p>กำลังโหลดหน้าตรวจน้ำ…</p>});
export function WaterPreviewEntry(){return <WaterPreview/>;}
