'use client';
import dynamic from 'next/dynamic';
const KoscheiReview = dynamic(() => import('./KoscheiReview'), { ssr: false });
export default function Page() { return <KoscheiReview />; }
