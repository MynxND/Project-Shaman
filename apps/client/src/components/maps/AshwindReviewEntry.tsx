'use client';
import dynamic from 'next/dynamic';
const Review=dynamic(()=>import('./AshwindReview').then(m=>m.AshwindReview),{ssr:false});
export function AshwindReviewEntry(){return <Review/>;}
