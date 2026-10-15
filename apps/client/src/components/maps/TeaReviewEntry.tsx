'use client';
import dynamic from 'next/dynamic';
const Review=dynamic(()=>import('./TeaReview').then(m=>m.TeaReview),{ssr:false});
export function TeaReviewEntry(){return <Review/>;}
