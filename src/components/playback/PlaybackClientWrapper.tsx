'use client';

import dynamic from 'next/dynamic';

// Dynamically import the PlaybackClient component to avoid SSR issues with Leaflet
const PlaybackClient = dynamic(
  () => import('@/components/playback/PlaybackClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل مشغل التسجيل...</p>
        </div>
      </div>
    )
  }
);

export default function PlaybackClientWrapper() {
  return <PlaybackClient />;
}

