'use client';

import React from 'react';
import { Truck, MapPin, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل الخريطة...</p>
      </div>
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
    <div className="p-3 sm:p-4 md:p-6">
      {/* فلتر */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          الكل ({vehicles.length})
        </button>
        <button
          onClick={() => onFilterChange('moving')}
          className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${
            filter === 'moving' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          متحركة ({vehicles.filter(v => v.status === 'moving').length})
        </button>
        <button
          onClick={() => onFilterChange('stopped')}
          className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${
            filter === 'stopped' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          متوقفة ({vehicles.filter(v => v.status === 'stopped').length})
        </button>
        <button
          onClick={() => onFilterChange('turnoff')}
          className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${
            filter === 'turnoff' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          مطفأة ({vehicles.filter(v => v.status === 'turnoff').length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* قائمة المركبات */}
        <div className="lg:col-span-1 space-y-3 max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">لا توجد مركبات</div>
          ) : (
            filteredVehicles.map(vehicle => (
            <div
              key={vehicle.id}
              onClick={() => onVehicleClick(vehicle)}
              className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition ${
                selectedVehicle?.id === vehicle.id
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">السائق:</span>
                  <span className="font-medium text-right wrap-break-word">{vehicle.driver}</span>
                </div>
                {vehicle.driverPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">رقم الهاتف:</span>
                    <span className="font-medium text-xs text-right break-all">{vehicle.driverPhone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">IMEI:</span>
                  <span className="font-medium text-xs text-right break-all">{vehicle.deviceImei}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">السرعة:</span>
                  <span className="font-medium">{Math.round(vehicle.speed)} كم/س</span>
                </div>
                <div className="hidden sm:flex justify-between items-center">
                  <span className="text-gray-600">البطارية:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          vehicle.battery > 50 ? 'bg-green-500' : 
                          vehicle.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${vehicle.battery}%` }}
                      />
                    </div>
                    <span className="font-medium text-xs">{Math.round(vehicle.battery)}%</span>
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
        <div className="lg:col-span-4 rounded-lg min-h-[400px] h-[400px] sm:min-h-[500px] sm:h-[500px] lg:min-h-[600px] lg:h-[600px] relative overflow-hidden border-2 border-gray-300 shadow-lg">
          <MapComponent 
            vehicles={vehicles} 
            selectedVehicle={selectedVehicle}
            onVehicleClick={onVehicleClick}
          />
        </div>
      </div>

      {selectedVehicle && (
        <div className="mt-3 sm:mt-4 md:mt-6 p-2.5 sm:p-3 md:p-4 lg:p-5 bg-linear-to-r from-blue-50 to-blue-100 border border-blue-300 sm:border-2 rounded-lg shadow-sm sm:shadow-md">
          <h3 className="font-bold text-blue-900 mb-2 sm:mb-3 md:mb-4 text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
            <span className="wrap-break-word text-xs sm:text-sm md:text-base">تفاصيل المركبة: {selectedVehicle.name}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 shadow-sm">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">رقم اللوحة</p>
              <p className="font-bold text-xs sm:text-sm md:text-base text-gray-900 wrap-break-word">{selectedVehicle.plate}</p>
            </div>
            <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 shadow-sm">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">IMEI الجهاز</p>
              <p className="font-bold text-[10px] sm:text-xs md:text-sm text-gray-900 break-all">{selectedVehicle.deviceImei}</p>
            </div>
            <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 shadow-sm">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">الموقع GPS</p>
              <p className="font-bold text-[10px] sm:text-xs md:text-sm text-gray-900 break-all">{selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}</p>
            </div>
            <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 shadow-sm">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">السرعة الحالية</p>
              <p className="font-bold text-xs sm:text-sm md:text-base text-gray-900">{Math.round(selectedVehicle.speed)} كم/س</p>
            </div>
            <div className="hidden sm:block bg-white rounded-lg p-1.5 sm:p-2 md:p-3 shadow-sm">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">حالة البطارية</p>
              <p className="font-bold text-xs sm:text-sm md:text-base text-gray-900">{Math.round(selectedVehicle.battery)}%</p>
            </div>
            <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 shadow-sm">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">الحالة</p>
              <p className="font-bold text-xs sm:text-sm md:text-base text-gray-900">{getStatusText(selectedVehicle.status)}</p>
            </div>
            {selectedVehicle.status === 'stopped' && (
              <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 shadow-sm col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-6">
                <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 shrink-0" />
                  إجمالي وقت الوقوف
                </p>
                <p className="font-bold text-sm sm:text-base md:text-lg text-orange-600">
                  {formatStoppedTime(getTotalStoppedTime(selectedVehicle))}
                </p>
              </div>
            )}
          </div>
          <div className="mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t border-blue-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm">
              <div className="wrap-break-word">
                <span className="text-gray-600">السائق: </span>
                <span className="font-medium">{selectedVehicle.driver}</span>
              </div>
              {selectedVehicle.driverPhone && (
                <div className="wrap-break-word">
                  <span className="text-gray-600">رقم هاتف السائق: </span>
                  <span className="font-medium break-all">{selectedVehicle.driverPhone}</span>
                </div>
              )}
              <div className="hidden sm:block wrap-break-word">
                <span className="text-gray-600">آخر تحديث: </span>
                <span className="font-medium">{selectedVehicle.lastUpdate.toLocaleString('ar-EG', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
              {selectedVehicle.status === 'stopped' && selectedVehicle.stoppedAt && (
                <div className="wrap-break-word">
                  <span className="text-gray-600">وقت بدء الوقوف: </span>
                  <span className="font-medium">{selectedVehicle.stoppedAt.toLocaleString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
              )}
              <div className="wrap-break-word">
                <span className="text-gray-600">تاريخ الإضافة: </span>
                <span className="font-medium">{selectedVehicle.createdAt.toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

