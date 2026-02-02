'use client';

import React from 'react';
import { X, Car, Smartphone, Activity, Zap, Save, User } from 'lucide-react';
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
  getStatusText,
}: VehiclesModelProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    plate: '',
    deviceImei: '',
    driverId: null as number | null,
    status: 'turnoff' as 'moving' | 'stopped' | 'turnoff',
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
        status: vehicle.status,
      });
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...vehicle!,
      ...formData,
      driver: drivers.find((d) => d.id === formData.driverId)?.name || '',
      driverPhone:
        drivers.find((d) => d.id === formData.driverId)?.phone || undefined,
    });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
      {/* Backdrop with blur */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200'>
        {/* Header */}
        <div className='bg-gray-50/80 backdrop-blur border-b border-gray-100 p-6 flex justify-between items-center'>
          <h3 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <Car className="w-6 h-6 text-blue-600" />
            تعديل بيانات المركبة / الموبايل
          </h3>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className="space-y-2">
              <label className='text-sm font-semibold text-gray-700 flex items-center gap-1.5'>
                <Car className="w-4 h-4 text-gray-400" />
                اسم المركبة / الموبايل <span className="text-red-500">*</span>
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400'
                placeholder='مثال: شاحنة التوزيع 1'
                required
              />
            </div>

            <div className="space-y-2">
              <label className='text-sm font-semibold text-gray-700 flex items-center gap-1.5'>
                <span className="text-gray-400 font-mono text-xs border rounded px-1">ABC</span>
                رقم اللوحة
              </label>
              <input
                type='text'
                value={formData.plate}
                onChange={(e) =>
                  setFormData({ ...formData, plate: e.target.value })
                }
                className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400'
                placeholder='مثال: أ ب ج - 123'
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className='text-sm font-semibold text-gray-700 flex items-center gap-1.5'>
                <Smartphone className="w-4 h-4 text-gray-400" />
                IMEI الجهاز <span className="text-red-500">*</span>
              </label>
              <input
                type='text'
                value={formData.deviceImei}
                onChange={(e) =>
                  setFormData({ ...formData, deviceImei: e.target.value })
                }
                className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono text-sm placeholder:text-gray-400'
                placeholder='مثال: 865432109876543'
                required
              />
              <p className="text-xs text-gray-500 px-1">رقم التعريف الدولي للجهاز (15 رقم)</p>
            </div>

            <div className="space-y-2">
              <label className='text-sm font-semibold text-gray-700 flex items-center gap-1.5'>
                <User className="w-4 h-4 text-gray-400" />
                السائق / المالك <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.driverId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      driverId: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all appearance-none bg-white'
                >
                  <option value=''>-- اختر المسؤول --</option>
                  {loadingDrivers ? (
                    <option disabled>جاري التحميل...</option>
                  ) : (
                    drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.phone})
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className='text-sm font-semibold text-gray-700 flex items-center gap-1.5'>
                <Zap className="w-4 h-4 text-gray-400" />
                الحالة الحالية
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'moving' | 'stopped' | 'turnoff',
                    })
                  }
                  className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all appearance-none bg-white'
                >
                  <option value='turnoff'>⚪ مطفأة (Turn Off)</option>
                  <option value='stopped'>🔴 متوقفة (Stopped)</option>
                  <option value='moving'>🟢 متحركة (Moving)</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className='pt-6 border-t border-gray-50 flex gap-3 justify-end'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm'
            >
              إلغاء التعديلات
            </button>
            <button
              type='submit'
              className='px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all transform active:scale-95 flex items-center gap-2'
            >
              <Save className='w-4 h-4' />
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
