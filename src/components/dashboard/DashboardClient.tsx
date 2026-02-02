'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Bell, Settings, Calendar } from 'lucide-react';
import MapTab from '@/components/dashboard/MapTab';
import DailyReportsTab from '@/components/dashboard/DailyReportsTab';
import VehiclesTab from '@/components/dashboard/VehiclesTab';
import DriversTab from '@/components/dashboard/DriversTab';
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
  driverPhone?: string;
  driver: string;
  driverId?: number | null;
  lastUpdate: Date;
  battery: number;
  createdAt: Date;
  stoppedAt?: Date | null;
  totalStoppedTime?: number;
  currentStoppedTime?: number;
}

interface Alert {
  id: number;
  type: 'warning' | 'info' | 'danger';
  message: string;
  time: string;
  vehicleId: number;
}

interface DashboardClientProps {
  initialVehicles?: any[];
}

export default function DashboardClient({ initialVehicles }: DashboardClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [loading, setLoading] = useState(true);

  // دالة مساعدة لتنسيق بيانات المركبة
  const formatVehicleData = (v: any): Vehicle => {
    const now = new Date();
    const lastUpdate = v.lastUpdate ? new Date(v.lastUpdate) : now;
    const stoppedAt = v.stoppedAt ? new Date(v.stoppedAt) : null;
    const isCurrentlyStopped = v.status === 'stopped' && stoppedAt;

    let currentStoppedTime = 0;
    if (isCurrentlyStopped && stoppedAt) {
      currentStoppedTime = Math.floor((now.getTime() - stoppedAt.getTime()) / 1000);
    }

    return {
      id: v.id,
      name: v.name,
      plate: v.plateNumber,
      deviceImei: v.deviceImei,
      lat: v.lastLatitude || 30.0444,
      lng: v.lastLongitude || 31.2357,
      speed: v.lastSpeed || 0,
      status: (v.status || 'turnoff') as 'moving' | 'stopped' | 'turnoff',
      driver: v.driver?.name || 'غير محدد',
      driverPhone: v.driver?.phone || undefined,
      driverId: v.driverId || null,
      lastUpdate: lastUpdate,
      battery: (v.latestTrackingPoint?.batteryLevel !== undefined && v.latestTrackingPoint?.batteryLevel !== null)
        ? Number(v.latestTrackingPoint.batteryLevel)
        : 100,
      createdAt: v.createdAt ? new Date(v.createdAt) : now,
      stoppedAt: stoppedAt,
      totalStoppedTime: v.totalStoppedTime || 0,
      currentStoppedTime: currentStoppedTime
    };
  };

  // دالة مساعدة للحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'turnoff': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // دالة مساعدة للحصول على نص الحالة
  const getStatusText = (status: string) => {
    switch (status) {
      case 'moving': return 'متحركة';
      case 'stopped': return 'متوقفة';
      case 'turnoff': return 'مطفأة';
      default: return 'غير معروف';
    }
  };

  // دالة مساعدة لتنسيق وقت الوقوف
  const formatStoppedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} ثانية`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${minutes} دقيقة ${secs} ثانية` : `${minutes} دقيقة`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (minutes === 0 && secs === 0) {
        return `${hours} ساعة`;
      } else if (secs === 0) {
        return `${hours} ساعة ${minutes} دقيقة`;
      } else {
        return `${hours} ساعة ${minutes} دقيقة ${secs} ثانية`;
      }
    }
  };

  // دالة مساعدة لحساب إجمالي وقت الوقوف
  const getTotalStoppedTime = (vehicle: Vehicle): number => {
    let total = vehicle.totalStoppedTime || 0;
    if (vehicle.status === 'stopped' && vehicle.stoppedAt) {
      const now = new Date();
      const currentStopped = Math.floor((now.getTime() - vehicle.stoppedAt.getTime()) / 1000);
      total += currentStopped;
    }
    return total;
  };

  // دالة لجلب المركبات
  const fetchVehicles = async () => {
    try {
      const response = await apiFetch('/api/vehicles');
      if (response.ok) {
        const data = await response.json();
        const formattedVehicles: Vehicle[] = data.vehicles.map(formatVehicleData);
        setVehicles(formattedVehicles);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setLoading(false);
    }
  };

  // تهيئة البيانات الأولية من الـ server
  useEffect(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      const formattedVehicles: Vehicle[] = initialVehicles.map(formatVehicleData);
      setVehicles(formattedVehicles);
      setLoading(false);
    } else {
      fetchVehicles();
    }
  }, [initialVehicles]);

  // تحديث المركبات من API كل 5 ثواني
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await apiFetch('/api/vehicles');
        if (response.ok) {
          const data = await response.json();
          const formattedVehicles: Vehicle[] = data.vehicles.map(formatVehicleData);
          setVehicles(formattedVehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // دالة لتركيز الخريطة على مركبة محددة
  const focusOnVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white shadow-md">
        <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'map', label: 'الخريطة المباشرة', icon: MapPin },
                { id: 'vehicles', label: 'ادارة المركبات / الموبايلات', icon: Settings },
                { id: 'drivers', label: 'ادارة السائقين / المستخدمين', icon: Truck },
                { id: 'reports', label: 'التقارير والإحصائيات', icon: Calendar },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex flex-col md:flex-row items-center justify-center gap-2 px-2 py-3 md:px-5 md:py-2.5 rounded-xl 
                    text-xs md:text-sm font-semibold transition-all duration-300 text-center md:text-right
                    ${activeTab === tab.id
                      ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200'
                    }
                  `}
                >
                  <tab.icon className={`w-5 h-5 md:w-4 md:h-4 mb-1 md:mb-0 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                  <span className="wrap-break-word w-full">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* محتوى التبويبات */}
        <div>
          {/* محتوى الخريطة */}
          {activeTab === 'map' && (
            <MapTab
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              filter={filter}
              loading={loading}
              onFilterChange={setFilter}
              onVehicleClick={focusOnVehicle}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              formatStoppedTime={formatStoppedTime}
              getTotalStoppedTime={getTotalStoppedTime}
            />
          )}

          {/* محتوى إدارة المركبات */}
          {activeTab === 'vehicles' && (
            <VehiclesTab
              vehicles={vehicles}
              onVehicleUpdate={fetchVehicles}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              formatVehicleData={formatVehicleData}
            />
          )}

          {/* محتوى إدارة السائقين */}
          {activeTab === 'drivers' && (
            <DriversTab />
          )}

          {/* محتوى التقارير اليومية */}
          {activeTab === 'reports' && (
            <DailyReportsTab
              vehicles={vehicles.map(v => ({
                id: v.id,
                name: v.name,
                plate: v.plate,
                deviceImei: v.deviceImei,
                driver: v.driver
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

