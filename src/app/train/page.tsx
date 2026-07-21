'use client';
import dynamic from 'next/dynamic';

const TrainClientPage = dynamic(() => import('./TrainClientPage'), { ssr: false });

export default function Page() {
  return <TrainClientPage />;
}
