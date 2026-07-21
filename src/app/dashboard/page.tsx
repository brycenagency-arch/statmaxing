'use client';
import dynamic from 'next/dynamic';

const DashboardClientPage = dynamic(() => import('./DashboardClientPage'), { ssr: false });

export default function Page() {
  return <DashboardClientPage />;
}
