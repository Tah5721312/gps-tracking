'use client';

import React from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Vehicle {
  id: number;
  name: string;
  plate: string;
  deviceImei: string;
  driver: string;
  status: 'moving' | 'stopped' | 'turnoff';
  driverPhone?: string;
  speed: number;
  lastUpdate: Date;
  driverId?: number | null;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
}

interface VehiclesModelProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onSave: (vehicle: Vehicle) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function VehiclesModel({
  isOpen,
  onClose,
  vehicle,
  onSave,
  getStatusColor,
  getStatusText
}: VehiclesModelProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    plate: '',
    deviceImei: '',
    driverId: null as number | null,
    status: 'turnoff' as 'moving' | 'stopped' | 'turnoff'
  });
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = React.useState(false);

  // جلب قائمة السائقين
  React.useEffect(() => {
    if (isOpen) {
      fetchDrivers();
    }
  }, [isOpen]);

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const response = await apiFetch('/api/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  React.useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name,
        plate: vehicle.plate,
        deviceImei: vehicle.deviceImei,
        driverId: vehicle.driverId || null,
        status: vehicle.status
      });
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...vehicle!,
      ...formData,
      driver: drivers.find(d => d.id === formData.driverId)?.name || '',
      driverPhone: drivers.find(d => d.id === formData.driverId)?.phone || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h3 className="text-xl font-bold text-gray-900">تعديل مركبة</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المركبة *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: شاحنة 1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم اللوحة *</label>
              <input
                type="text"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: ABC-123"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IMEI الجهاز *</label>
              <input
                type="text"
                value={formData.deviceImei}
                onChange={(e) => setFormData({ ...formData, deviceImei: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: 123456789012345"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السائق</label>
              <select
                value={formData.driverId || ''}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- اختر سائق --</option>
                {loadingDrivers ? (
                  <option disabled>جاري التحميل...</option>
                ) : (
                  drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.phone}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حالة المركبة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'moving' | 'stopped' | 'turnoff' })}
                className="w-full px-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="turnoff">مطفأة</option>
                <option value="stopped">متوقفة</option>
                <option value="moving">متحركة</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

