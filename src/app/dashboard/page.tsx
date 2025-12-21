'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Truck, Activity, Clock, Navigation, AlertCircle, Download, Bell, Maximize2, Settings, Calendar } from 'lucide-react';
import MapTab from '@/components/dashboard/MapTab';
import ReportsTab from '@/components/dashboard/ReportsTab';
import VehiclesTab from '@/components/dashboard/VehiclesTab';
import TripsTab from '@/components/dashboard/TripsTab';

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
  lastUpdate: Date;
  battery: number;
  createdAt: Date;
  stoppedAt?: Date | null;
  totalStoppedTime?: number; // بالثواني
  currentStoppedTime?: number; // وقت الوقوف الحالي بالثواني
}

interface Trip {
  id: number;
  vehicleId: number;
  startTime: string;
  endTime: string;
  distance: number;
  duration: string;
  stops: number;
  avgSpeed: number;
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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tripStats, setTripStats] = useState({ totalDistance: 0, totalTrips: 0, avgSpeed: 0, totalStops: 0 });
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

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
      driver: v.driverName || 'غير محدد',
      driverPhone: v.driverPhone || undefined,
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
      const response = await fetch('/api/vehicles');
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

  // دالة مساعدة لجلب رحلات اليوم
  const fetchTodayTrips = async (date?: string) => {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const startDate = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
      const endDate = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();
      
      const vehicleIdParam = selectedVehicleFilter !== 'all' ? `&vehicleId=${selectedVehicleFilter}` : '';
      const response = await fetch(`/api/reports/trips?startDate=${startDate}&endDate=${endDate}${vehicleIdParam}`);
      if (response.ok) {
        const data = await response.json();
        
        // حفظ الإحصائيات
        if (data.stats) {
          setTripStats(data.stats);
        }
        
        const formattedTrips: Trip[] = data.trips.map((trip: any) => {
          const start = new Date(trip.startTime);
          const end = trip.endTime ? new Date(trip.endTime) : new Date();
          const durationMs = end.getTime() - start.getTime();
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          
          return {
            id: trip.id,
            vehicleId: trip.vehicleId,
            startTime: start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            endTime: trip.endTime ? end.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'قيد التنفيذ',
            distance: trip.distance,
            duration: `${hours}س ${minutes}د`,
            stops: trip.stops,
            avgSpeed: Math.round(trip.avgSpeed)
          };
        });
        setTrips(formattedTrips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  // جلب رحلات اليوم عند التحميل الأولي
  useEffect(() => {
    fetchTodayTrips(selectedDate);
  }, []);

  // جلب الرحلات عند فتح تبويب التقارير أو تغيير الفلاتر
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchTodayTrips(selectedDate);
      // تحديث الرحلات كل 10 ثواني عند فتح تبويب التقارير
      const interval = setInterval(() => {
        fetchTodayTrips(selectedDate);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedDate, selectedVehicleFilter]);

  // تحديث المركبات من API كل 5 ثواني
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/vehicles');
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

  // دالة لتصدير التقرير
  const exportReport = () => {
    const csvContent = trips.map(trip => {
      const vehicle = vehicles.find(v => v.id === trip.vehicleId);
      return `${vehicle?.name || 'غير معروف'},${trip.startTime},${trip.endTime},${trip.distance},${trip.duration},${trip.stops},${trip.avgSpeed}`;
    }).join('\n');
    
    const blob = new Blob(['\ufeff' + 'المركبة,وقت البداية,وقت النهاية,المسافة (كم),المدة,التوقفات,متوسط السرعة (كم/س)\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_الرحلات_${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
  };

  // حساب إجمالي المسافة اليومية
  const todayDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);

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
                <div className="text-right">
                  <p className="text-sm text-gray-600">مسافة اليوم</p>
                  <p className="text-xl font-bold text-blue-600">{todayDistance.toFixed(1)} كم</p>
                </div>
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
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-6 font-medium transition ${
                  activeTab === 'reports'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  التقارير والرحلات
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
                onClick={() => setActiveTab('trips')}
                className={`py-4 px-6 font-medium transition ${
                  activeTab === 'trips'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  إدارة الرحلات
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

          {/* محتوى التقارير */}
          {activeTab === 'reports' && (
            <ReportsTab
              vehicles={vehicles}
              trips={trips}
              tripStats={tripStats}
              selectedDate={selectedDate}
              selectedVehicleFilter={selectedVehicleFilter}
              onDateChange={(date) => {
                setSelectedDate(date);
                fetchTodayTrips(date);
              }}
              onVehicleFilterChange={setSelectedVehicleFilter}
              onExportReport={exportReport}
            />
          )}

          {/* محتوى إدارة المركبات */}
          {activeTab === 'vehicles' && (
            <VehiclesTab
              vehicles={vehicles}
              onVehicleUpdate={async () => {
                const response = await fetch('/api/vehicles');
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

          {/* محتوى إدارة الرحلات */}
          {activeTab === 'trips' && (
            <TripsTab
              vehicles={vehicles.map(v => ({
                id: v.id,
                name: v.name,
                plate: v.plate,
                driver: v.driver
              }))}
              onTripUpdate={() => {
                // تحديث التقارير عند إضافة/تعديل/حذف رحلة
                fetchTodayTrips(selectedDate);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
