'use client';

import React from 'react';
import { Download, Activity, Navigation, Truck, Clock } from 'lucide-react';

interface Vehicle {
  id: number;
  name: string;
  plate: string;
  deviceImei: string;
  driver: string;
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

interface ReportsTabProps {
  vehicles: Vehicle[];
  trips: Trip[];
  tripStats: {
    totalDistance: number;
    totalTrips: number;
    avgSpeed: number;
    totalStops: number;
  };
  selectedDate: string;
  selectedVehicleFilter: string;
  onDateChange: (date: string) => void;
  onVehicleFilterChange: (vehicleId: string) => void;
  onExportReport: () => void;
}

export default function ReportsTab({
  vehicles,
  trips,
  tripStats,
  selectedDate,
  selectedVehicleFilter,
  onDateChange,
  onVehicleFilterChange,
  onExportReport
}: ReportsTabProps) {
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">تقرير الرحلات</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs text-gray-600 mb-1">التاريخ:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">المركبة:</label>
              <select
                value={selectedVehicleFilter}
                onChange={(e) => onVehicleFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                <option value="all">جميع المركبات</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id.toString()}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <button 
          onClick={onExportReport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          تصدير Excel
        </button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">إجمالي الرحلات</p>
              <p className="text-3xl font-bold">{tripStats.totalTrips}</p>
            </div>
            <Activity className="w-12 h-12 opacity-20" />
          </div>
        </div>
        <div className="bg-linear-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">إجمالي المسافة</p>
              <p className="text-3xl font-bold">{tripStats.totalDistance.toFixed(1)} كم</p>
            </div>
            <Navigation className="w-12 h-12 opacity-20" />
          </div>
        </div>
        <div className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">متوسط السرعة</p>
              <p className="text-3xl font-bold">{Math.round(tripStats.avgSpeed)} كم/س</p>
            </div>
            <Truck className="w-12 h-12 opacity-20" />
          </div>
        </div>
        <div className="bg-linear-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">إجمالي التوقفات</p>
              <p className="text-3xl font-bold">{tripStats.totalStops}</p>
            </div>
            <Clock className="w-12 h-12 opacity-20" />
          </div>
        </div>
      </div>
      
      {/* جدول الرحلات */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2">
              <tr>
                <th className="px-4 py-4 text-right font-bold text-gray-700">#</th>
                <th className="px-4 py-4 text-right font-bold text-gray-700">المركبة</th>
                <th className="px-4 py-4 text-right font-bold text-gray-700">السائق</th>
                <th className="px-4 py-4 text-right font-bold text-gray-700">وقت البداية</th>
                <th className="px-4 py-4 text-right font-bold text-gray-700">وقت النهاية</th>
                <th className="px-4 py-4 text-right font-bold text-gray-700">المسافة (كم)</th>
                <th className="px-4 py-4 text-right font-bold text-gray-700">المدة</th>
                <th className="px-4 py-4 text-right font-bold text-gray-700">متوسط السرعة</th>
                <th className="px-4 py-4 text-right font-bold text-gray-700">التوقفات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-12 h-12 text-gray-300" />
                      <p className="text-lg">لا توجد رحلات لهذا اليوم</p>
                      <p className="text-sm text-gray-400">سيتم عرض الرحلات هنا عند توفرها</p>
                    </div>
                  </td>
                </tr>
              ) : (
                trips.map((trip, index) => {
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  return (
                    <tr key={trip.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">{vehicle?.name || 'غير معروف'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{vehicle?.driver || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          {trip.startTime}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trip.endTime === 'قيد التنفيذ' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {trip.endTime}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900 font-bold">{trip.distance.toFixed(1)}</span>
                        <span className="text-gray-500 text-xs mr-1">كم</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{trip.duration}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          {trip.avgSpeed} كم/س
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          {trip.stops}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

