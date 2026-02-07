'use client';

import { useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import { apiFetch } from '@/lib/api';

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

interface TrackingMapProps {
  vehicle: Vehicle | null;
  trip: Trip | null;
  destinationNameAr: string;
}

export default function TrackingMap({ vehicle, trip, destinationNameAr }: TrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const hasSetInitialView = useRef(false);
  const [routePolyline, setRoutePolyline] = useState<L.Polyline | null>(null);

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

    // تحديث محتوى الـ Popup إذا كان مفتوحاً
    if (markerRef.current.isPopupOpen()) {
      // يمكن تحديث المحتوى هنا لو أردنا، لكن الـ bindPopup يقوم بذلك عند الفتح التالي عادة
      // للتحديث الفوري نحتاج إلى setPopupContent
      // ...
    }

    // تحديث عرض الخريطة مرة واحدة فقط عند التحميل
    if (!hasSetInitialView.current && position[0] !== 0 && position[1] !== 0) {
      if (trip?.destinationLat && trip?.destinationLng) {
        const bounds = L.latLngBounds([position, [trip.destinationLat, trip.destinationLng]]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapRef.current.setView(position, 15);
      }
      hasSetInitialView.current = true;
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
    apiFetch(`https://router.project-osrm.org/route/v1/walking/${vehicle.lng},${vehicle.lat};${trip.destinationLng},${trip.destinationLat}?overview=full&geometries=geojson`)
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

  return (
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
  );
}
