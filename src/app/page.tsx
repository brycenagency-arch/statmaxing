'use client';
import dynamic from 'next/dynamic';

const PatchboardClient = dynamic(() => import('./PatchboardClient'), { ssr: false });

export default function Home() {
  return <PatchboardClient />;
}
