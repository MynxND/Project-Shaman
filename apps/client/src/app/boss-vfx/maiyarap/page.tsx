'use client';
import dynamic from 'next/dynamic';
const MaiyarapReview = dynamic(() => import('./MaiyarapReview'), { ssr: false });
export default function Page() { return <MaiyarapReview />; }
