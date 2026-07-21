'use client';
import dynamic from 'next/dynamic';

const ReasonClient = dynamic(() => import('./ReasonClient'), { ssr: false });

export default function ReasonPage() {
  return <ReasonClient />;
}
