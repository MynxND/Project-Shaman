'use client';
import dynamic from 'next/dynamic';
const Review=dynamic(()=>import('./SanctuaryReview').then(m=>m.SanctuaryReview),{ssr:false});
export function SanctuaryReviewEntry(){return <Review/>;}
