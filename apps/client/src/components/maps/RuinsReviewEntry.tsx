'use client';
import dynamic from 'next/dynamic';
const Review=dynamic(()=>import('./RuinsReview').then(m=>m.RuinsReview),{ssr:false});
export function RuinsReviewEntry(){return <Review/>;}
