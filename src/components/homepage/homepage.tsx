'use client';

import Link from 'next/link';
import { Truck, MapPin } from 'lucide-react';

export default function HomepageClient() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
                     <div className="flex justify-between items-center py-4">
                      <div className="flex items-center gap-3">
                        <Truck className="w-8 h-8 text-blue-600" />
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">نظام تتبع GPS</h1>
                          <p className="text-sm text-gray-600">مراقبة مباشرة لأسطول المركبات / الموبايلات</p>
                        </div>
                      </div>
                    </div> 
        <div className="flex items-center justify-center gap-3 mb-8">
          <Truck className="w-12 h-12 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">نظام تتبع المركبات GPS</h1>
        </div>
        <p className="text-gray-600 mb-8">مراقبة وإدارة أسطول الشحن لحظياً</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            لوحة التحكم
          </Link>
          <Link
            href="/gps-simulator"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
          >
            <Truck className="w-5 h-5" />
            محاكي GPS
          </Link>
        </div>
      </div>
    </main>
  );
}
