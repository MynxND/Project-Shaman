'use client';
import dynamic from 'next/dynamic';
const Review=dynamic(()=>import('./StompReview'),{ssr:false});
export default function Page(){return <Review/>;}
