'use client';
import dynamic from'next/dynamic';import type{IndonesiaMapId}from'./indonesia-review-data';
const Review=dynamic(()=>import('./IndonesiaReview').then(m=>m.IndonesiaReview),{ssr:false});
export function IndonesiaReviewEntry({initialId}:{initialId?:IndonesiaMapId}){return <Review initialId={initialId}/>;}
