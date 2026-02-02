import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  // Check authentication
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/dashboard'));
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
      <DashboardClient />
    </Suspense>
  );
}
