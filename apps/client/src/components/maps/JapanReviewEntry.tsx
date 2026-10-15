'use client';
import dynamic from'next/dynamic';import type{JapanMapId}from'./japan-review-data';
const Review=dynamic(()=>import('./JapanReview').then(m=>m.JapanReview),{ssr:false});
export function JapanReviewEntry({initialId}:{initialId?:JapanMapId}){return <Review initialId={initialId}/>;}
