'use client';
import dynamic from 'next/dynamic';
const Lab = dynamic(() => import('./CharacterRigLab').then(m => m.CharacterRigLab), { ssr: false });
export function CharacterRigLabEntry() { return <Lab />; }
