'use client';

import { useEffect, useRef } from 'react';
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

interface MapComponentProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onVehicleClick: (vehicle: Vehicle) => void;
}

export default function MapComponent({ vehicles, selectedVehicle, onVehicleClick }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof L | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || typeof window === 'undefined') return;

    // تحميل Leaflet بشكل ديناميكي
    const initMap = async () => {
      try {
        // التحقق مرة أخرى قبل التهيئة (للتأكد من عدم التهيئة المزدوجة)
        if (mapRef.current || !mapContainerRef.current) return;

        // تحميل CSS
        await import('leaflet/dist/leaflet.css');
        
        // تحميل Leaflet
        const leaflet = await import('leaflet');
        const L = leaflet.default;
        leafletRef.current = L;

        // إصلاح أيقونات Leaflet الافتراضية
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // التحقق مرة أخرى قبل إنشاء الخريطة
        if (!mapContainerRef.current || mapRef.current) return;

        // إنشاء الخريطة
        mapRef.current = L.map(mapContainerRef.current).setView([30.0444, 31.2357], 12);

        // إضافة طبقة الخريطة من OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);

        console.log('Map initialized, adding vehicles:', vehicles);
        // إضافة المركبات بعد تهيئة الخريطة
        if (vehicles.length > 0) {
          vehicles.forEach(vehicle => {
            // التحقق من وجود إحداثيات صحيحة
            if (vehicle.lat && vehicle.lng && !isNaN(vehicle.lat) && !isNaN(vehicle.lng)) {
              addOrUpdateMarker(vehicle, L);
            } else {
              console.warn('Vehicle missing valid coordinates:', vehicle);
            }
          });
        }
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

  // تحديث المركبات عند تغيير البيانات
  useEffect(() => {
    if (leafletRef.current && mapRef.current && vehicles.length > 0) {
      console.log('Updating markers for vehicles:', vehicles);
      vehicles.forEach(vehicle => {
        // التحقق من وجود إحداثيات صحيحة
        if (vehicle.lat && vehicle.lng && !isNaN(vehicle.lat) && !isNaN(vehicle.lng)) {
          addOrUpdateMarker(vehicle, leafletRef.current!);
        } else {
          console.warn('Vehicle missing valid coordinates:', vehicle);
        }
      });
    }
  }, [vehicles]);

  // تركيز الخريطة على مركبة محددة
  useEffect(() => {
    if (selectedVehicle && mapRef.current) {
      mapRef.current.setView([selectedVehicle.lat, selectedVehicle.lng], 15);
      if (markersRef.current[selectedVehicle.id]) {
        markersRef.current[selectedVehicle.id].openPopup();
      }
    }
  }, [selectedVehicle]);

  // دالة مساعدة لإنشاء محتوى Popup
  const createPopupContent = (vehicle: Vehicle) => {
    return `
      <div style="font-family: Arial; direction: rtl; padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${vehicle.name}</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>لوحة:</strong> ${vehicle.plate}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>السائق:</strong> ${vehicle.driver}</p>
        ${vehicle.driverPhone ? `<p style="margin: 4px 0; font-size: 13px;"><strong>رقم التليفون:</strong> ${vehicle.driverPhone}</p>` : ''}
        <p style="margin: 4px 0; font-size: 13px;"><strong>السرعة:</strong> ${Math.round(vehicle.speed)} كم/س</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>البطارية:</strong> ${Math.round(vehicle.battery)}%</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>الحالة:</strong> ${
          vehicle.status === 'moving' ? 'متحركة' : 
          vehicle.status === 'stopped' ? 'متوقفة' : 
          'مطفأة'
        }</p>
        <p style="margin: 4px 0; font-size: 11px; color: #666;"><strong>آخر تحديث:</strong> ${vehicle.lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    `;
  };

  const addOrUpdateMarker = (vehicle: Vehicle, L: any) => {
    if (!mapRef.current || !L) {
      console.warn('Map or Leaflet not initialized');
      return;
    }

    // التحقق من صحة الإحداثيات
    if (!vehicle.lat || !vehicle.lng || isNaN(vehicle.lat) || isNaN(vehicle.lng)) {
      console.warn('Invalid coordinates for vehicle:', vehicle.id, vehicle.lat, vehicle.lng);
      return;
    }

    const position: [number, number] = [vehicle.lat, vehicle.lng];
    console.log('Adding/updating marker for vehicle:', vehicle.name, 'at', position);
    
    // إنشاء أيقونة مخصصة
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: ${
            vehicle.status === 'moving' ? '#10b981' : 
            vehicle.status === 'stopped' ? '#ef4444' : 
            '#6b7280'
          };
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (markersRef.current[vehicle.id]) {
      // تحديث موقع Marker موجود
      const marker = markersRef.current[vehicle.id];
      marker.setLatLng(position);
      marker.setIcon(icon);
      
      // تحديث محتوى Popup بالبيانات الجديدة
      const popupContent = createPopupContent(vehicle);
      marker.setPopupContent(popupContent);
      
      // إذا كان Popup مفتوح، قم بتحديثه
      if (marker.isPopupOpen()) {
        marker.openPopup();
      }
    } else {
      // إنشاء Marker جديد
      const marker = L.marker(position, { icon }).addTo(mapRef.current);
      
      // إضافة Popup
      const popupContent = createPopupContent(vehicle);
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onVehicleClick(vehicle);
      });

      markersRef.current[vehicle.id] = marker;
    }
  };

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
