'use client';
import dynamic from'next/dynamic';import type{NorwayMapId}from'./norway-review-data';
const Review=dynamic(()=>import('./NorwayReview').then(m=>m.NorwayReview),{ssr:false});
export function NorwayReviewEntry({initialId}:{initialId?:NorwayMapId}){return <Review initialId={initialId}/>;}
