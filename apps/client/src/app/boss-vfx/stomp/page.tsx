'use client';
import dynamic from 'next/dynamic';
const Review=dynamic(()=>import('../shuten/ShutenReview'),{ssr:false});
export default function Page(){return <Review initialSkill="mountain-stomp"/>;}
