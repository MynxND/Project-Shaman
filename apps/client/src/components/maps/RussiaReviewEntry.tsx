'use client';
import dynamic from'next/dynamic';import type{RussiaMapId}from'./russia-review-data';
const Review=dynamic(()=>import('./RussiaReview').then(m=>m.RussiaReview),{ssr:false});
export function RussiaReviewEntry({initialId}:{initialId?:RussiaMapId}){return <Review initialId={initialId}/>;}
