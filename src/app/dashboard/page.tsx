'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Truck, Activity, Clock, Navigation, AlertCircle, Download, Bell, Maximize2, Settings, Calendar } from 'lucide-react';
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
  totalStoppedTime?: number; // بالثواني
  currentStoppedTime?: number; // وقت الوقوف الحالي بالثواني
}


interface Alert {
  id: number;
  type: 'warning' | 'info' | 'danger';
  message: string;
  time: string;
  vehicleId: number;
}

// البيانات ستُجلب من قاعدة البيانات فقط

export default function GPSTrackingDashboard() {
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
    
    // حساب وقت الوقوف الحالي إذا كانت المركبة متوقفة الآن
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
      battery: v.latestTrackingPoint?.batteryLevel || 100,
      createdAt: v.createdAt ? new Date(v.createdAt) : now,
      stoppedAt: stoppedAt,
      totalStoppedTime: v.totalStoppedTime || 0,
      currentStoppedTime: currentStoppedTime
    };
  };

  // دالة مساعدة للحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'moving': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'turnoff': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // دالة مساعدة للحصول على نص الحالة
  const getStatusText = (status: string) => {
    switch(status) {
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

  // جلب المركبات عند التحميل الأولي
  useEffect(() => {
    fetchVehicles();
  }, []);


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
        <header className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">نظام تتبع المركبات GPS</h1>
                  <p className="text-sm text-gray-600">مراقبة مباشرة لأسطول المركبات</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition"
                >
                  <Bell className="w-6 h-6" />
                  {alerts.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {alerts.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* التبويبات */}
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setActiveTab('map')}
                className={`py-4 px-6 font-medium transition ${
                  activeTab === 'map'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  الخريطة المباشرة
                </div>
              </button>

              <button
                onClick={() => setActiveTab('vehicles')}
                className={`py-4 px-6 font-medium transition ${
                  activeTab === 'vehicles'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  إدارة المركبات
                </div>
              </button>


              <button
                onClick={() => setActiveTab('drivers')}
                className={`py-4 px-6 font-medium transition ${
                  activeTab === 'drivers'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  إدارة السائقين
                </div>
              </button>

              
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-6 font-medium transition ${
                  activeTab === 'reports'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  التقارير اليومية
                </div>
              </button>

            
            </div>
          </div>
        </header>

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
              onVehicleUpdate={async () => {
                const response = await apiFetch('/api/vehicles');
                if (response.ok) {
                  const data = await response.json();
                  const formattedVehicles: Vehicle[] = data.vehicles.map(formatVehicleData);
                  setVehicles(formattedVehicles);
                }
              }}
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
