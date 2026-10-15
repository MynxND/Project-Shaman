'use client';
import dynamic from 'next/dynamic';
const Review=dynamic(()=>import('./BambooReview').then(m=>m.BambooReview),{ssr:false});
export function BambooReviewEntry(){return <Review/>;}
