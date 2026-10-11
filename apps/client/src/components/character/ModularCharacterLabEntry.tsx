'use client';

import dynamic from 'next/dynamic';
import { TurnaroundInspector } from './TurnaroundInspector';
import { CharacterFoundationInspector } from './CharacterFoundationInspector';

const Lab = dynamic(() => import('./ModularCharacterLab').then(module => module.ModularCharacterLab), { ssr: false });
export function ModularCharacterLabEntry() { return <><CharacterFoundationInspector /><TurnaroundInspector /><details><summary>Archived Extraction Experiment / ไม่ใช่ฐานที่อนุมัติ</summary><Lab /></details></>; }