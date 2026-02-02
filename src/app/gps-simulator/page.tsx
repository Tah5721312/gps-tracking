import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import GpsSimulatorClient from '@/components/gps-simulator/gps-simulator';


export default async function GpsSimulatorPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/gps-simulator'));
  }
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <GpsSimulatorClient />
    </Suspense>
  );
}

