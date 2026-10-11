'use client';

import dynamic from 'next/dynamic';
const Lab = dynamic(() => import('./HeadCharacterLab').then(module => module.HeadCharacterLab), { ssr: false });
export function HeadCharacterLabEntry() { return <Lab />; }