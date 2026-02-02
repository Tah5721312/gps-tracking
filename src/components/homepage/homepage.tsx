'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Truck, MapPin } from 'lucide-react';
import Hero from '@/components/Hero';
import { useSession } from 'next-auth/react';

export default function HomepageClient() {
  const { data: session } = useSession();

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden overflow-y-auto -m-4 w-full max-w-none" dir="rtl">
      {/* Full Screen Background Image */}
      <div className="fixed inset-0 w-full h-full -z-10">
        <Image
          src="https://res.cloudinary.com/dr8ivazek/image/upload/v1770062057/2149764129_jo3xqw.jpg"
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-fill"
          style={{ objectFit: 'fill', width: '100%', height: '100%' }}
          quality={100}
        />
        {/* Modern Overlay with Gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/80 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 py-12 items-center">

        {/* Hero Section with text color override for dark background */}
        <div className="w-full [&_h1]:text-white! [&_div]:text-white!">
          <Hero />
        </div>

        {/* Action Card */}
        <div className="w-full max-w-lg">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-10 shadow-2xl transform transition-all hover:scale-[1.01] duration-300">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 drop-shadow-md">
              نظام تتبع المركبات
            </h2>

            <div className="flex flex-col gap-4">
              <Link
                href="/dashboard"
                className="group relative px-6 py-4 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-white font-bold shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-3 w-full"
              >
                <MapPin className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="relative text-lg">لوحة التحكم</span>
              </Link>

              {/* GPS Simulator - Admin Only */}
              {(session?.user as any)?.role === 'ADMIN' && (
                <Link
                  href="/gps-simulator"
                  className="group relative px-6 py-4 bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl text-white font-bold shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-3 w-full"
                >
                  <Truck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="relative text-lg">محاكي GPS</span>
                </Link>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
