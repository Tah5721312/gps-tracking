'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Calendar, MapPin, Clock, Navigation, Truck } from 'lucide-react';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/api';

// تحميل DestinationPicker بشكل ديناميكي (لأنه يستخدم Leaflet)
const DestinationPicker = dynamic(() => import('@/components/dashboard/DestinationPicker'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">جاري تحميل الخريطة...</div>
});

interface Vehicle {
  id: number;
  name: string;
  plate: string;
  driver: string;
}

interface Trip {
  id: number;
  vehicleId: number;
  startTime: string;
  endTime: string | null;
  distance: number;
  avgSpeed: number;
  maxSpeed: number;
  stops: number;
  notes?: string | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationName?: string | null;
  arrivalStatus?: string;
  arrivalTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
  vehicle?: {
    id: number;
    name: string;
    plateNumber: string;
    driverName: string | null;
  };
}

interface TripsTabProps {
  vehicles: Vehicle[];
  onTripUpdate: () => void;
}

export default function TripsTab({ vehicles, onTripUpdate }: TripsTabProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    startTime: '',
    endTime: '',
    distance: '',
    avgSpeed: '',
    maxSpeed: '',
    stops: '',
    notes: '',
    destinationLat: '',
    destinationLng: '',
    destinationName: ''
  });
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // جلب الرحلات
  const fetchTrips = async () => {
    try {
      setLoading(true);
      let url = '/api/trips?';
      if (filterVehicle !== 'all') {
        url += `vehicleId=${filterVehicle}&`;
      }
      if (filterDate) {
        const startDate = new Date(filterDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filterDate);
        endDate.setHours(23, 59, 59, 999);
        url += `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      
      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        const formattedTrips: Trip[] = data.trips.map((trip: any) => ({
          ...trip,
          startTime: new Date(trip.startTime).toISOString().slice(0, 16),
          endTime: trip.endTime ? new Date(trip.endTime).toISOString().slice(0, 16) : null,
          arrivalTime: trip.arrivalTime ? new Date(trip.arrivalTime).toISOString() : null
        }));
        setTrips(formattedTrips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [filterVehicle, filterDate]);

  // حفظ رحلة (إضافة أو تعديل)
  const handleSave = async () => {
    if (!formData.vehicleId || !formData.startTime) {
      alert('الرجاء ملء جميع الحقول المطلوبة (المركبة ووقت البداية)');
      return;
    }

    try {
      const tripData = {
        vehicleId: parseInt(formData.vehicleId),
        startTime: formData.startTime,
        endTime: formData.endTime || null,
        distance: parseFloat(formData.distance || '0'),
        avgSpeed: parseFloat(formData.avgSpeed || '0'),
        maxSpeed: parseFloat(formData.maxSpeed || '0'),
        stops: parseInt(formData.stops || '0'),
        notes: formData.notes || null,
        destinationLat: formData.destinationLat ? parseFloat(formData.destinationLat) : null,
        destinationLng: formData.destinationLng ? parseFloat(formData.destinationLng) : null,
        destinationName: formData.destinationName || null
      };

      if (editingTrip) {
        // تحديث رحلة
        const response = await apiFetch(`/api/trips/${editingTrip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tripData)
        });
        if (response.ok) {
          onTripUpdate();
          fetchTrips();
          handleCancel();
        } else {
          const error = await response.json();
          alert(error.error || 'حدث خطأ أثناء تحديث الرحلة');
        }
      } else {
        // إضافة رحلة جديدة
        const response = await apiFetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tripData)
        });
        if (response.ok) {
          onTripUpdate();
          fetchTrips();
          handleCancel();
        } else {
          const error = await response.json();
          alert(error.error || 'حدث خطأ أثناء إضافة الرحلة');
        }
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('حدث خطأ أثناء حفظ الرحلة');
    }
  };

  // حذف رحلة
  const handleDelete = async (tripId: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الرحلة؟')) {
      try {
        const response = await apiFetch(`/api/trips/${tripId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          onTripUpdate();
          fetchTrips();
        } else {
          alert('حدث خطأ أثناء حذف الرحلة');
        }
      } catch (error) {
        console.error('Error deleting trip:', error);
        alert('حدث خطأ أثناء حذف الرحلة');
      }
    }
  };

  // إلغاء التعديل/الإضافة
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingTrip(null);
    setFormData({
      vehicleId: '',
      startTime: '',
      endTime: '',
      distance: '',
      avgSpeed: '',
      maxSpeed: '',
      stops: '',
      notes: '',
      destinationLat: '',
      destinationLng: '',
      destinationName: ''
    });
  };

  // بدء التعديل
  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setShowAddForm(false);
    setFormData({
      vehicleId: trip.vehicleId.toString(),
      startTime: trip.startTime,
      endTime: trip.endTime || '',
      distance: trip.distance.toString(),
      avgSpeed: trip.avgSpeed.toString(),
      maxSpeed: trip.maxSpeed.toString(),
      stops: trip.stops.toString(),
      notes: trip.notes || '',
      destinationLat: trip.destinationLat?.toString() || '',
      destinationLng: trip.destinationLng?.toString() || '',
      destinationName: trip.destinationName || ''
    });
  };

  // حساب المدة
  const calculateDuration = (startTime: string, endTime: string | null): string => {
    if (!endTime) return 'قيد التنفيذ';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}س ${minutes}د`;
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">إدارة الرحلات</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs text-gray-600 mb-1">المركبة:</label>
              <select
                value={filterVehicle}
                onChange={(e) => setFilterVehicle(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                <option value="all">جميع المركبات</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id.toString()}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">التاريخ:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingTrip(null);
            setFormData({
              vehicleId: '',
              startTime: new Date().toISOString().slice(0, 16),
              endTime: '',
              distance: '',
              avgSpeed: '',
              maxSpeed: '',
              stops: '',
              notes: '',
              destinationLat: '',
              destinationLng: '',
              destinationName: ''
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة رحلة جديدة
        </button>
      </div>

      {/* نموذج إضافة/تعديل رحلة */}
      {(showAddForm || editingTrip) && (
        <div className="mb-6 p-6 bg-white rounded-lg border-2 border-blue-300 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-900">
              {editingTrip ? 'تعديل رحلة' : 'إضافة رحلة جديدة'}
            </h4>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المركبة *</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر مركبة</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id.toString()}>{v.name} ({v.plate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وقت البداية *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وقت النهاية</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسافة (كم)</label>
              <input
                type="number"
                step="0.1"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">متوسط السرعة (كم/س)</label>
              <input
                type="number"
                step="0.1"
                value={formData.avgSpeed}
                onChange={(e) => setFormData({ ...formData, avgSpeed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">أقصى سرعة (كم/س)</label>
              <input
                type="number"
                step="0.1"
                value={formData.maxSpeed}
                onChange={(e) => setFormData({ ...formData, maxSpeed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عدد التوقفات</label>
              <input
                type="number"
                value={formData.stops}
                onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تحديد الوجهة على الخريطة
              </label>
              <DestinationPicker
                destinationLat={formData.destinationLat}
                destinationLng={formData.destinationLng}
                destinationName={formData.destinationName}
                onLatChange={(lat) => setFormData({ ...formData, destinationLat: lat })}
                onLngChange={(lng) => setFormData({ ...formData, destinationLng: lng })}
                onNameChange={(name) => setFormData({ ...formData, destinationName: name })}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 يمكنك البحث عن المكان أو النقر على الخريطة لاختيار الوجهة
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="ملاحظات إضافية عن الرحلة..."
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingTrip ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* جدول الرحلات */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2">
                <tr>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">#</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">المركبة</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">وقت البداية</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">وقت النهاية</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">المدة</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">المسافة</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">متوسط السرعة</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">أقصى سرعة</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">التوقفات</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">الوجهة</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">حالة الوصول</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">ملاحظات</th>
                  <th className="px-4 py-4 text-right font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-12 h-12 text-gray-300" />
                        <p className="text-lg">لا توجد رحلات</p>
                        <p className="text-sm text-gray-400">اضغط على "إضافة رحلة جديدة" لبدء تسجيل الرحلات</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trips.map((trip, index) => {
                    const vehicle = trip.vehicle || vehicles.find(v => v.id === trip.vehicleId);
                    return (
                      <tr key={trip.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{vehicle?.name || 'غير معروف'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {new Date(trip.startTime).toLocaleString('ar-EG', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            !trip.endTime 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {trip.endTime 
                              ? new Date(trip.endTime).toLocaleString('ar-EG', { 
                                  year: 'numeric', 
                                  month: '2-digit', 
                                  day: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : 'قيد التنفيذ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{calculateDuration(trip.startTime, trip.endTime)}</td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900 font-bold">{trip.distance.toFixed(1)}</span>
                          <span className="text-gray-500 text-xs mr-1">كم</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {trip.avgSpeed.toFixed(1)} كم/س
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            {trip.maxSpeed.toFixed(1)} كم/س
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            {trip.stops}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {trip.destinationName ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-900 font-medium text-xs">{trip.destinationName}</span>
                              {trip.destinationLat && trip.destinationLng && (
                                <span className="text-gray-500 text-xs">
                                  {trip.destinationLat.toFixed(4)}, {trip.destinationLng.toFixed(4)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {trip.arrivalStatus === 'arrived' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              وصلت
                              {trip.arrivalTime && (
                                <span className="text-xs">
                                  ({new Date(trip.arrivalTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              )}
                            </span>
                          ) : trip.arrivalStatus === 'in_progress' ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                              في الطريق
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">غير محدد</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate" title={trip.notes || ''}>
                          {trip.notes || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(trip)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(trip.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

