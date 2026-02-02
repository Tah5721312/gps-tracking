'use client';

import React from 'react';
import { Truck, MapPin, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mb-4"></div>
      <p className="text-gray-500 font-medium animate-pulse">جاري تحميل الخريطة...</p>
    </div>
  )
});

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
  stoppedAt?: Date | null;
  totalStoppedTime?: number;
  currentStoppedTime?: number;
}

interface MapTabProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  filter: string;
  loading: boolean;
  onFilterChange: (filter: string) => void;
  onVehicleClick: (vehicle: Vehicle) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatStoppedTime: (seconds: number) => string;
  getTotalStoppedTime: (vehicle: Vehicle) => number;
}

export default function MapTab({
  vehicles,
  selectedVehicle,
  filter,
  loading,
  onFilterChange,
  onVehicleClick,
  getStatusColor,
  getStatusText,
  formatStoppedTime,
  getTotalStoppedTime
}: MapTabProps) {
  const filteredVehicles = vehicles.filter(v =>
    filter === 'all' || v.status === filter
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4 p-4 md:p-6 overflow-hidden">
      {/* الفلاتر العلوية */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0">
        {[
          { id: 'all', label: 'الكل', count: vehicles.length, color: 'bg-blue-600', activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' },
          { id: 'moving', label: 'متحركة', count: vehicles.filter(v => v.status === 'moving').length, color: 'bg-green-600', activeClass: 'bg-green-500 text-white shadow-lg shadow-green-500/30' },
          { id: 'stopped', label: 'متوقفة', count: vehicles.filter(v => v.status === 'stopped').length, color: 'bg-red-600', activeClass: 'bg-red-500 text-white shadow-lg shadow-red-500/30' },
          { id: 'turnoff', label: 'مطفأة', count: vehicles.filter(v => v.status === 'turnoff').length, color: 'bg-gray-600', activeClass: 'bg-gray-600 text-white shadow-lg shadow-gray-500/30' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
              ${filter === f.id
                ? f.activeClass
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }
            `}
          >
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === f.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 min-h-0 overflow-hidden">
        {/* قائمة المركبات */}
        <div className="lg:col-span-3 space-y-3 max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">لا توجد مركبات</div>
          ) : (
            filteredVehicles.map(vehicle => (
              <div
                key={vehicle.id}
                onClick={() => onVehicleClick(vehicle)}
                className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition ${selectedVehicle?.id === vehicle.id
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow'
                  }`}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-gray-900">{vehicle.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{vehicle.plate}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs text-white whitespace-nowrap ${getStatusColor(vehicle.status)}`}>
                    {getStatusText(vehicle.status)}
                  </span>
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600 whitespace-nowrap">السائق/المالك:</span>
                    <span className="font-medium text-right wrap-break-word">{vehicle.driver || 'غير محدد'}</span>
                  </div>
                  {vehicle.driverPhone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">رقم الهاتف:</span>
                      <span className="font-medium text-xs text-right break-all">{vehicle.driverPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600 whitespace-nowrap">IMEI:</span>
                    <span className="font-medium text-xs text-right break-all font-mono">{vehicle.deviceImei}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600 whitespace-nowrap">السرعة:</span>
                    <span className="font-medium text-blue-600">{Math.round(vehicle.speed)} كم/س</span>
                  </div>
                  <div className="hidden sm:flex justify-between items-center gap-2">
                    <span className="text-gray-600 whitespace-nowrap">البطارية:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 sm:w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-300 ${vehicle.battery > 50 ? 'bg-green-500' :
                            vehicle.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${Math.max(0, Math.min(100, vehicle.battery))}%` }}
                        />
                      </div>
                      <span className={`font-bold text-xs min-w-[35px] text-right ${vehicle.battery > 50 ? 'text-green-600' :
                        vehicle.battery > 30 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {Math.round(vehicle.battery)}%
                      </span>
                    </div>
                  </div>
                  {vehicle.status === 'stopped' && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="whitespace-nowrap">وقت الوقوف:</span>
                      </span>
                      <span className="font-medium text-xs text-orange-600">
                        {formatStoppedTime(getTotalStoppedTime(vehicle))}
                      </span>
                    </div>
                  )}
                  <p className="hidden sm:block text-xs text-gray-400 pt-1.5 sm:pt-2 border-t border-gray-200">
                    آخر تحديث: {vehicle.lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* الخريطة - Leaflet + OpenStreetMap */}
        <div className="lg:col-span-9 rounded-xl min-h-[300px] h-[300px] sm:min-h-[400px] sm:h-[400px] lg:min-h-[600px] lg:h-[600px] relative overflow-hidden border-2 border-gray-200 shadow-xl bg-gray-50">
          <MapComponent
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onVehicleClick={onVehicleClick}
          />
        </div>
      </div>
    </div>
  );
}

