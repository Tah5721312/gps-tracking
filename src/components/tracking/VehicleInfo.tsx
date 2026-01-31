'use client';

import { Truck, User, Phone, Activity, Gauge, Battery, Clock, Navigation } from 'lucide-react';

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

interface VehicleInfoProps {
  vehicle: Vehicle;
}

export default function VehicleInfo({ vehicle }: VehicleInfoProps) {
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

  return (
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
  );
}
