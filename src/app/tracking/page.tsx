'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Truck, Navigation, Battery, Gauge, MapPin, Clock, User, Phone, Activity, Radio } from 'lucide-react';
import type L from 'leaflet';

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

export default function TrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [routePolyline, setRoutePolyline] = useState<L.Polyline | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [destinationNameAr, setDestinationNameAr] = useState<string>('');

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof L | null>(null);

  // جلب بيانات المركبة
  const fetchVehicle = async () => {
    if (!vehicleId) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        const v = data.vehicle;

        const formattedVehicle: Vehicle = {
          id: v.id,
          name: v.name,
          plate: v.plateNumber,
          deviceImei: v.deviceImei,
          lat: v.lastLatitude || 30.0444,
          lng: v.lastLongitude || 31.2357,
          speed: v.lastSpeed || 0,
          status: (v.status || 'turnoff') as 'moving' | 'stopped' | 'turnoff',
          driver: v.driverName || 'غير محدد',
          driverPhone: v.driverPhone || undefined,
          lastUpdate: v.lastUpdate ? new Date(v.lastUpdate) : new Date(),
          battery: v.latestTrackingPoint?.batteryLevel || 100,
          createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
        };

        setVehicle(formattedVehicle);
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // جلب اسم المكان بالعربية
  const fetchDestinationNameAr = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
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

  // جلب الرحلة النشطة
  const fetchActiveTrip = async () => {
    if (!vehicleId) return;

    try {
      const response = await fetch(`/api/trips?vehicleId=${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        // البحث عن رحلة نشطة (بدون endTime)
        const activeTrip = data.trips.find((t: any) => !t.endTime && t.destinationLat && t.destinationLng);
        if (activeTrip) {
          setTrip({
            id: activeTrip.id,
            destinationLat: activeTrip.destinationLat,
            destinationLng: activeTrip.destinationLng,
            destinationName: activeTrip.destinationName,
            arrivalStatus: activeTrip.arrivalStatus,
          });
          
          // جلب اسم الوجهة بالعربية
          if (activeTrip.destinationLat && activeTrip.destinationLng) {
            await fetchDestinationNameAr(activeTrip.destinationLat, activeTrip.destinationLng);
          }
        } else {
          setTrip(null);
          setDestinationNameAr('');
        }
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    }
  };

  // تهيئة الخريطة
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    const initMap = async () => {
      // انتظار حتى يكون container موجوداً في DOM
      let attempts = 0;
      while (!mapContainerRef.current && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      try {
        // تحميل CSS
        await import('leaflet/dist/leaflet.css');
        
        // تحميل Leaflet
        const leaflet = await import('leaflet');
        const L = leaflet.default;
        leafletRef.current = L;

        // إصلاح أيقونات Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // التحقق مرة أخرى
        if (!mapContainerRef.current || mapRef.current) {
          return;
        }

        const initialLat = 30.0444;
        const initialLng = 31.2357;

        // إنشاء الخريطة
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([initialLat, initialLng], 15);

        // إضافة طبقة الخريطة
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // التأكد من أن الخريطة تعرض بشكل صحيح
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 300);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // تحديث موقع المركبة على الخريطة
  useEffect(() => {
    if (!leafletRef.current || !mapRef.current || !vehicle) return;

    const L = leafletRef.current;
    const position: [number, number] = [vehicle.lat, vehicle.lng];

    // تحديث حجم الخريطة أولاً
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);

    // إنشاء أو تحديث Marker المركبة
    if (!markerRef.current) {
      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${vehicle.status === 'moving' ? `
              <div style="
                position: absolute;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0) 70%);
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              "></div>
            ` : ''}
            <div style="
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: linear-gradient(135deg, ${vehicle.status === 'moving' ? '#10b981, #059669' : vehicle.status === 'stopped' ? '#ef4444, #dc2626' : '#6b7280, #4b5563'});
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              z-index: 10;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background-color: white;
                border-radius: 50%;
                box-shadow: 0 0 4px rgba(0,0,0,0.2);
              "></div>
            </div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.5;
                transform: scale(1.5);
              }
            }
          </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      markerRef.current = L.marker(position, { icon: vehicleIcon }).addTo(mapRef.current);
      markerRef.current.bindPopup(`
        <div style="font-family: Arial; direction: rtl; text-align: right; padding: 8px;">
          <strong style="font-size: 16px; color: #1f2937;">${vehicle.name}</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">${vehicle.plate}</span>
        </div>
      `);
    } else {
      markerRef.current.setLatLng(position);
    }

    // تحديث عرض الخريطة
    if (trip?.destinationLat && trip?.destinationLng) {
      const bounds = L.latLngBounds([position, [trip.destinationLat, trip.destinationLng]]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      mapRef.current.setView(position, 15);
    }
  }, [vehicle, trip]);

  // رسم المسار إلى الوجهة
  useEffect(() => {
    if (!leafletRef.current || !mapRef.current || !vehicle || !trip?.destinationLat || !trip?.destinationLng) {
      if (routePolyline) {
        mapRef.current?.removeLayer(routePolyline);
        setRoutePolyline(null);
      }
      if (destinationMarkerRef.current) {
        mapRef.current?.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }
      return;
    }

    const L = leafletRef.current;
    const startPos: [number, number] = [vehicle.lat, vehicle.lng];
    const endPos: [number, number] = [trip.destinationLat!, trip.destinationLng!];

    // حذف المسار القديم
    if (routePolyline) {
      mapRef.current.removeLayer(routePolyline);
    }

    // جلب مسار المشي من OSRM (Open Source Routing Machine)
    fetch(`https://router.project-osrm.org/route/v1/walking/${vehicle.lng},${vehicle.lat};${trip.destinationLng},${trip.destinationLat}?overview=full&geometries=geojson`)
      .then(response => response.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

          const polyline = L.polyline(coordinates as [number, number][], {
            color: '#3b82f6',
            weight: 6,
            opacity: 0.8,
            dashArray: '12, 8',
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(mapRef.current!);

          setRoutePolyline(polyline);
        } else {
          // إذا فشل جلب المسار، ارسم خط مستقيم
          const polyline = L.polyline([startPos, endPos], {
            color: '#3b82f6',
            weight: 6,
            opacity: 0.8,
            dashArray: '12, 8',
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(mapRef.current!);

          setRoutePolyline(polyline);
        }
      })
      .catch(error => {
        console.error('Error fetching route:', error);
        // في حالة الخطأ، ارسم خط مستقيم
        const polyline = L.polyline([startPos, endPos], {
          color: '#3b82f6',
          weight: 6,
          opacity: 0.8,
          dashArray: '12, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapRef.current!);

        setRoutePolyline(polyline);
      });

    // إضافة Marker للوجهة
    if (!destinationMarkerRef.current) {
      const destinationIcon = L.divIcon({
        className: 'destination-marker',
        html: `
          <div style="
            width: 35px;
            height: 35px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              width: 35px;
              height: 35px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0) 70%);
              animation: pulse-destination 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            "></div>
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50% 50% 50% 0;
              background: linear-gradient(135deg, #ef4444, #dc2626);
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4), 0 0 0 4px rgba(255,255,255,0.3);
              transform: rotate(-45deg);
              position: relative;
              z-index: 10;
            "></div>
          </div>
          <style>
            @keyframes pulse-destination {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.5;
                transform: scale(1.4);
              }
            }
          </style>
        `,
        iconSize: [35, 35],
        iconAnchor: [17, 35],
      });

      destinationMarkerRef.current = L.marker(endPos, { icon: destinationIcon }).addTo(mapRef.current);
      
      // تحديث popup الوجهة بالاسم العربي
      const destinationName = destinationNameAr || trip.destinationName || 'موقع محدد';
      destinationMarkerRef.current.bindPopup(`
        <div style="font-family: Arial; direction: rtl; text-align: right; padding: 8px;">
          <strong style="font-size: 16px; color: #1f2937;">الوجهة</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">${destinationName}</span>
        </div>
      `);
    } else {
      destinationMarkerRef.current.setLatLng(endPos);
      // تحديث popup أيضاً عند تحديث العلامة
      const destinationName = destinationNameAr || trip.destinationName || 'موقع محدد';
      destinationMarkerRef.current.bindPopup(`
        <div style="font-family: Arial; direction: rtl; text-align: right; padding: 8px;">
          <strong style="font-size: 16px; color: #1f2937;">الوجهة</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">${destinationName}</span>
        </div>
      `);
    }
  }, [vehicle, trip, destinationNameAr]);

  // تحديث حجم الخريطة عند تغيير حجم النافذة
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // جلب البيانات عند التحميل
  useEffect(() => {
    if (vehicleId) {
      fetchVehicle();
      fetchActiveTrip();
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }, [vehicleId]);

  // تحديث البيانات كل 5 ثواني
  useEffect(() => {
    if (!vehicleId) return;

    const interval = setInterval(() => {
      fetchVehicle();
      fetchActiveTrip();
    }, 5000);

    return () => clearInterval(interval);
  }, [vehicleId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'from-green-500 to-emerald-600';
      case 'stopped': return 'from-red-500 to-rose-600';
      case 'turnoff': return 'from-gray-500 to-slate-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'moving': return 'متحركة';
      case 'stopped': return 'متوقفة';
      case 'turnoff': return 'مطفأة';
      default: return 'غير معروف';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'moving': return '🚗';
      case 'stopped': return '⏸️';
      case 'turnoff': return '⏹️';
      default: return '❓';
    }
  };

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
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
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
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 hover:shadow-2xl transition-shadow duration-300">
              <div 
                className="w-full relative" 
                ref={mapContainerRef}
                style={{
                  height: '600px',
                  minHeight: '600px',
                  width: '100%',
                  position: 'relative',
                  zIndex: 0,
                  backgroundColor: '#f3f4f6'
                }}
              >
                {/* Live indicator overlay */}
                <div className="absolute top-4 left-4 z-1000 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-200/50 flex items-center gap-2">
                  <div className="relative">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">مباشر</span>
                </div>
              </div>
            </div>
          </div>

          {/* بيانات المركبة */}
          <div className="space-y-6">
            {/* بطاقة معلومات المركبة */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2.5 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{vehicle.name}</h2>
                  <p className="text-sm text-gray-500">معلومات المركبة</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-300">
                  <span className="text-gray-600 font-medium">لوحة المركبة</span>
                  <span className="font-bold text-gray-900 text-lg">{vehicle.plate}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-300">
                  <span className="text-gray-600 flex items-center gap-2 font-medium">
                    <User className="w-4 h-4 text-blue-500" />
                    السائق
                  </span>
                  <span className="font-bold text-gray-900">{vehicle.driver}</span>
                </div>

                {vehicle.driverPhone && (
                  <div className="flex items-center justify-between p-4 bg-linear-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-300">
                    <span className="text-gray-600 flex items-center gap-2 font-medium">
                      <Phone className="w-4 h-4 text-blue-500" />
                      رقم التليفون
                    </span>
                    <a href={`tel:${vehicle.driverPhone}`} className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      {vehicle.driverPhone}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-300">
                  <span className="text-gray-600 flex items-center gap-2 font-medium">
                    <Activity className="w-4 h-4 text-purple-500" />
                    الحالة
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getStatusIcon(vehicle.status)}</span>
                    <span className={`px-4 py-1.5 rounded-xl text-sm font-bold text-white bg-linear-to-r ${getStatusColor(vehicle.status)} shadow-lg`}>
                      {getStatusText(vehicle.status)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-linear-to-br from-green-50 to-emerald-100/50 rounded-xl border border-green-200/50 hover:shadow-md transition-all duration-300">
                  <span className="text-gray-600 flex items-center gap-2 font-medium">
                    <Gauge className="w-4 h-4 text-green-500" />
                    السرعة
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-2xl text-gray-900">{Math.round(vehicle.speed)}</span>
                    <span className="text-sm text-gray-600 font-medium">كم/س</span>
                  </div>
                </div>

                <div className="p-4 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 flex items-center gap-2 font-medium">
                      <Battery className="w-4 h-4 text-yellow-500" />
                      البطارية
                    </span>
                    <span className="font-bold text-lg text-gray-900">{Math.round(vehicle.battery)}%</span>
                  </div>
                  <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-500 ease-out rounded-full ${vehicle.battery > 50 ? 'bg-linear-to-r from-green-400 to-green-600' :
                        vehicle.battery > 20 ? 'bg-linear-to-r from-yellow-400 to-yellow-600' :
                          'bg-linear-to-r from-red-400 to-red-600'
                        }`}
                      style={{ width: `${vehicle.battery}%` }}
                    >
                      <div className="w-full h-full bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-linear-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-300">
                  <span className="text-gray-600 flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 text-purple-500" />
                    آخر تحديث
                  </span>
                  <span className="font-bold text-gray-900">
                    {vehicle.lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="p-4 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600 font-medium">الإحداثيات</span>
                  </div>
                  <p className="font-mono text-xs text-gray-700 bg-white/70 px-3 py-2 rounded-lg">
                    {vehicle.lat.toFixed(6)}, {vehicle.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            {/* معلومات الوجهة */}
            {trip && trip.destinationLat && trip.destinationLng && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

