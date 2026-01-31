'use client';

import { MapPin } from 'lucide-react';

interface Trip {
  id: number;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationName: string | null;
  arrivalStatus: string;
}

interface DestinationInfoProps {
  trip: Trip | null;
  destinationNameAr: string;
}

export default function DestinationInfo({ trip, destinationNameAr }: DestinationInfoProps) {
  if (!trip || !trip.destinationLat || !trip.destinationLng) {
    return null;
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <div className="p-2.5 bg-linear-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">الوجهة</h2>
          <p className="text-sm text-gray-500">معلومات الوجهة النشطة</p>
        </div>
      </div>

      <div className="space-y-3">
        {(destinationNameAr || trip.destinationName) && (
          <div className="p-4 bg-linear-to-br from-red-50 to-rose-100/50 rounded-xl border border-red-200/50">
            <p className="text-sm text-gray-600 mb-1 font-medium">اسم الوجهة</p>
            <p className="font-bold text-gray-900 text-lg">{destinationNameAr || trip.destinationName || 'موقع محدد'}</p>
          </div>
        )}

        <div className="p-4 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50">
          <p className="text-sm text-gray-600 mb-2 font-medium">الإحداثيات</p>
          <p className="font-mono text-xs text-gray-700 bg-white/70 px-3 py-2 rounded-lg">
            {trip.destinationLat.toFixed(6)}, {trip.destinationLng.toFixed(6)}
          </p>
        </div>

        <div className="p-4 bg-linear-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50">
          <p className="text-sm text-gray-600 mb-2 font-medium">حالة الوصول</p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${trip.arrivalStatus === 'arrived' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <p className={`font-bold text-lg ${trip.arrivalStatus === 'arrived' ? 'text-green-600' : 'text-blue-600'
              }`}>
              {trip.arrivalStatus === 'arrived' ? '✅ تم الوصول' : '🚗 قيد التوجه'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
