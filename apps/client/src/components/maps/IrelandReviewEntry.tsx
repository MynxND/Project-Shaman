'use client';
import dynamic from'next/dynamic';import type{IrelandMapId}from'./ireland-review-data';
const Review=dynamic(()=>import('./IrelandReview').then(m=>m.IrelandReview),{ssr:false});
export function IrelandReviewEntry({initialId}:{initialId?:IrelandMapId}){return <Review initialId={initialId}/>;}
