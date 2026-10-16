'use client';
import dynamic from 'next/dynamic';
const Review=dynamic(()=>import('./ShutenReview'),{ssr:false});
export default function Page(){return <Review/>;}
