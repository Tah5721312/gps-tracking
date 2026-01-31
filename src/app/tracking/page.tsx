import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import TrackingClient from '@/components/tracking/TrackingClient';

export default async function TrackingPage() {
  // التحقق من الجلسة في Server Component
  const session = await auth();

  // إذا لم يكن هناك جلسة، إعادة التوجيه إلى صفحة تسجيل الدخول
  if (!session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/tracking'));
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
      <TrackingClient />
    </Suspense>
  );
}
