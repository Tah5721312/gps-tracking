'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Truck, Radio } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import TrackingMap from '@/components/tracking/TrackingMap';
import VehicleInfo from '@/components/tracking/VehicleInfo';
import DestinationInfo from '@/components/tracking/DestinationInfo';

interface Vehicle {
  id: number;
  name: string;
  plate: string;
  deviceImei: string;
  lat: number;
  lng: number;
  speed: number;
  status: 'moving' | 'stopped' | 'turnoff';
  driver: string;
  driverPhone?: string;
  lastUpdate: Date;
  battery: number;
  createdAt: Date;
}

interface Trip {
  id: number;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationName: string | null;
  arrivalStatus: string;
}

export default function TrackingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [destinationNameAr, setDestinationNameAr] = useState<string>('');
  const [deviceImei, setDeviceImei] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // جلب بيانات المركبة الأساسية (مرة واحدة فقط) للحصول على deviceImei
  const fetchVehicleInfo = async () => {
    if (!vehicleId) return;

    try {
      const response = await apiFetch(`/api/vehicles/${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        const v = data.vehicle;

        // حفظ deviceImei للاستخدام في polling
        if (v.deviceImei) {
          setDeviceImei(v.deviceImei);
          // جلب آخر حالة مباشرة من API (Source of Truth)
          fetchLiveVehicleData(v.deviceImei, v);
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle info:', error);
    }
  };

  // جلب آخر حالة المركبة من API (Source of Truth)
  const fetchLiveVehicleData = async (imei: string, vehicleInfo?: any) => {
    try {
      setIsUpdating(true);
      const response = await apiFetch(`/api/vehicles/live/${imei}`);
      if (response.ok) {
        const data = await response.json();

        const formattedVehicle: Vehicle = {
          id: data.vehicleId || vehicleInfo?.id || 0,
          name: vehicleInfo?.name || 'غير محدد',
          plate: vehicleInfo?.plateNumber || 'غير محدد',
          deviceImei: data.imei || imei,
          lat: data.latitude || 30.0444,
          lng: data.longitude || 31.2357,
          speed: data.speed || 0,
          status: (data.status || 'turnoff') as 'moving' | 'stopped' | 'turnoff',
          driver: data.driver?.name || vehicleInfo?.driver?.name || 'غير محدد',
          driverPhone: data.driver?.phone || vehicleInfo?.driver?.phone || undefined,
          lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : new Date(),
          battery: data.batteryLevel ?? 100,
          createdAt: vehicleInfo?.createdAt ? new Date(vehicleInfo.createdAt) : new Date(),
        };

        setVehicle(formattedVehicle);
      }
    } catch (error) {
      console.error('Error fetching live vehicle data:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // جلب اسم المكان بالعربية
  const fetchDestinationNameAr = async (lat: number, lng: number) => {
    try {
      const response = await apiFetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`,
        {
          headers: {
            'User-Agent': 'GPS-Tracking-App/1.0'
          }
        }
      );
      const data = await response.json();

      if (data.display_name) {
        const address = data.address || {};
        let name = data.display_name;

        // تحسين اسم المكان
        if (address.road || address.house_number) {
          const parts = [];
          if (address.house_number) parts.push(address.house_number);
          if (address.road) parts.push(address.road);
          if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
          if (parts.length > 0) {
            name = parts.join('، ');
          }
        } else if (address.building || address.amenity) {
          name = address.building || address.amenity;
          if (address.road) name += ` - ${address.road}`;
        }

        setDestinationNameAr(name);
        return name;
      }
    } catch (error) {
      console.error('Error fetching destination name:', error);
    }
    return '';
  };

  // جلب البيانات عند التحميل (مرة واحدة فقط للحصول على deviceImei)
  useEffect(() => {
    if (vehicleId) {
      fetchVehicleInfo();
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }, [vehicleId, router]);

  // Polling لجلب آخر حالة من API (Source of Truth) كل 3 ثواني
  useEffect(() => {
    if (!deviceImei) return;

    // جلب البيانات فوراً
    fetchLiveVehicleData(deviceImei);

    // Polling كل 3 ثواني
    pollIntervalRef.current = setInterval(() => {
      fetchLiveVehicleData(deviceImei);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [deviceImei]);

  // جلب اسم الوجهة عند تغيير الوجهة
  useEffect(() => {
    if (trip?.destinationLat && trip?.destinationLng) {
      fetchDestinationNameAr(trip.destinationLat, trip.destinationLng);
    }
  }, [trip?.destinationLat, trip?.destinationLng]);

  if (loading || !vehicle) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-400 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium text-lg">جاري تحميل بيانات التتبع...</p>
          <p className="mt-2 text-gray-500 text-sm">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50" dir="rtl">
      {/* Header مع زر الرجوع */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-white/80 rounded-xl transition-all duration-300 hover:shadow-md group"
            >
              <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">رجوع</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">تتبع المركبة</h1>
            </div>
            <div className="flex items-center gap-2">
              {isUpdating && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-xs text-blue-600 font-medium">تحديث...</span>
                </div>
              )}
              <div className="w-24"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* الخريطة */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <TrackingMap
              vehicle={vehicle}
              trip={trip}
              destinationNameAr={destinationNameAr}
            />
          </div>

          {/* بيانات المركبة */}
          <div className="space-y-6 order-1 lg:order-2">
            <VehicleInfo vehicle={vehicle} />
            {/* <DestinationInfo trip={trip} destinationNameAr={destinationNameAr} /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
