'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Car, Smartphone, Zap, Clock, Activity, Search } from 'lucide-react';
import VehiclesModel from './VeheclesModel';
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

interface VehiclesTabProps {
  vehicles: Vehicle[];
  onVehicleUpdate: () => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatVehicleData: (v: any) => Vehicle;
}

export default function VehiclesTab({
  vehicles,
  onVehicleUpdate,
  getStatusColor,
  getStatusText,
  formatVehicleData,
}: VehiclesTabProps) {
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    deviceImei: '',
    driverId: null as number | null,
    status: 'turnoff' as 'moving' | 'stopped' | 'turnoff',
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب قائمة السائقين
  useEffect(() => {
    fetchDrivers();
  }, []);

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

  const handleSave = async () => {
    if (editingVehicle) {
      // تحديث مركبة
      try {
        const response = await apiFetch(`/api/vehicles/${editingVehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editingVehicle.name,
            plateNumber: editingVehicle.plate,
            deviceImei: editingVehicle.deviceImei,
            driverId: editingVehicle.driverId || null,
            status: editingVehicle.status,
          }),
        });
        if (response.ok) {
          onVehicleUpdate();
          setEditingVehicle(null);
        }
      } catch (error) {
        console.error('Error updating vehicle:', error);
        alert('حدث خطأ أثناء تحديث المركبة/الموبايل');
      }
    } else {
      // إضافة مركبة جديدة
      if (!formData.name || !formData.deviceImei) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
      }
      try {
        const response = await apiFetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            plateNumber: formData.plateNumber,
            deviceImei: formData.deviceImei,
            driverId: formData.driverId,
            status: formData.status,
          }),
        });
        if (response.ok) {
          onVehicleUpdate();
          setShowAddForm(false);
          setFormData({
            name: '',
            plateNumber: '',
            deviceImei: '',
            driverId: null,
            status: 'turnoff',
          });
        } else {
          const error = await response.json();
          alert(error.error || 'حدث خطأ أثناء إضافة المركبة/الموبايل');
        }
      } catch (error) {
        console.error('Error adding vehicle:', error);
        alert('حدث خطأ أثناء إضافة المركبة/الموبايل');
      }
    }
  };

  const handleDelete = async (vehicleId: number, vehicleName: string) => {
    if (confirm(`هل أنت متأكد من حذف المركبة/الموبايل "${vehicleName}"؟`)) {
      try {
        const response = await apiFetch(`/api/vehicles/${vehicleId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          onVehicleUpdate();
        } else {
          alert('حدث خطأ أثناء حذف المركبة/الموبايل');
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('حدث خطأ أثناء حذف المركبة/الموبايل');
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingVehicle(null);
    setFormData({
      name: '',
      plateNumber: '',
      deviceImei: '',
      driverId: null,
      status: 'turnoff',
    });
  };

  const handleSaveModal = async (vehicle: Vehicle) => {
    try {
      const response = await apiFetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: vehicle.name,
          plateNumber: vehicle.plate,
          deviceImei: vehicle.deviceImei,
          driverId: (vehicle as any).driverId || null,
          status: vehicle.status,
        }),
      });
      if (response.ok) {
        onVehicleUpdate();
        setEditingVehicle(null);
      } else {
        alert('حدث خطأ أثناء تحديث المركبة/الموبايل');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('حدث خطأ أثناء تحديث المركبة/الموبايل');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (v.name?.toLowerCase() || '').includes(searchLower) ||
      (v.plate?.toLowerCase() || '').includes(searchLower) ||
      (v.driver?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <div className='p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-full'>
      {/* Header Section */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100'>
        <div>
          <h3 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <Car className="w-6 h-6 text-blue-600" />
            إدارة المركبات والموبايلات
          </h3>
          <p className="text-gray-500 text-sm mt-1">إدارة وضبط أسطول المركبات والأجهزة المتصلة</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="بحث عن مركبة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400 text-sm"
            />
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setFormData({
                name: '',
                plateNumber: '',
                deviceImei: '',
                driverId: null,
                status: 'turnoff',
              });
            }}
            className='px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 font-medium'
          >
            <Plus className='w-5 h-5' />
            إضافة جديد
          </button>
        </div>
      </div>

      {/* نموذج إضافة/تعديل مركبة */}
      {(showAddForm || editingVehicle) && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200'>
          <div className='w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50'>
              <h4 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                {editingVehicle ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                {editingVehicle ? 'تعديل بيانات المركبة/الموبايل' : 'إضافة مركبة جديدة/موبايل جديد'}
              </h4>
              <button
                onClick={handleCancel}
                className='p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className="space-y-2">
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-1'>
                  <Car className="w-4 h-4 text-gray-400" />
                  اسم المركبة/الموبايل <span className="text-red-500">*</span>
                </label>
                <input
                  type='text'
                  value={editingVehicle ? (editingVehicle.name || '') : (formData.name || '')}
                  onChange={(e) => {
                    if (editingVehicle) {
                      setEditingVehicle({ ...editingVehicle, name: e.target.value });
                    } else {
                      setFormData({ ...formData, name: e.target.value });
                    }
                  }}
                  className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all'
                  placeholder='مثال: شاحنة التوزيع 1'
                />
              </div>

              <div className="space-y-2">
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-1'>
                  <span className="text-gray-400 font-mono text-xs border rounded px-1">ABC</span>
                  رقم اللوحة
                </label>
                <input
                  type='text'
                  value={editingVehicle ? (editingVehicle.plate || '') : (formData.plateNumber || '')}
                  onChange={(e) => {
                    if (editingVehicle) {
                      setEditingVehicle({ ...editingVehicle, plate: e.target.value });
                    } else {
                      setFormData({ ...formData, plateNumber: e.target.value });
                    }
                  }}
                  className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all'
                  placeholder='مثال: أ ب ج - 123'
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-1'>
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  IMEI الجهاز <span className="text-red-500">*</span>
                </label>
                <input
                  type='text'
                  value={editingVehicle ? (editingVehicle.deviceImei || '') : (formData.deviceImei || '')}
                  onChange={(e) => {
                    if (editingVehicle) {
                      setEditingVehicle({ ...editingVehicle, deviceImei: e.target.value });
                    } else {
                      setFormData({ ...formData, deviceImei: e.target.value });
                    }
                  }}
                  className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-mono text-sm'
                  placeholder='مثال: 865432109876543'
                />
                <p className="text-xs text-gray-500">رقم التعريف الدولي للجهاز المكون من 15 رقم</p>
              </div>

              <div className="space-y-2">
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-1'>
                  <Activity className="w-4 h-4 text-gray-400" />
                  السائق / المالك <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingVehicle ? editingVehicle.driverId || '' : formData.driverId || ''}
                  onChange={(e) => {
                    const driverId = e.target.value ? parseInt(e.target.value) : null;
                    if (editingVehicle) {
                      const selectedDriver = drivers.find((d) => d.id === driverId);
                      setEditingVehicle({
                        ...editingVehicle,
                        driverId: driverId,
                        driver: selectedDriver?.name || '',
                        driverPhone: selectedDriver?.phone || undefined,
                      });
                    } else {
                      setFormData({ ...formData, driverId: driverId });
                    }
                  }}
                  className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all appearance-none bg-white'
                >
                  <option value=''>-- اختر المسؤول --</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-1'>
                  <Zap className="w-4 h-4 text-gray-400" />
                  الحالة الابتدائية
                </label>
                <select
                  value={editingVehicle ? editingVehicle.status : formData.status}
                  onChange={(e) => {
                    const status = e.target.value as any;
                    if (editingVehicle) setEditingVehicle({ ...editingVehicle, status });
                    else setFormData({ ...formData, status });
                  }}
                  className='w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all appearance-none bg-white'
                >
                  <option value='turnoff'>⚪ مطفأة (Turn Off)</option>
                  <option value='stopped'>🔴 متوقفة (Stopped)</option>
                  <option value='moving'>🟢 متحركة (Moving)</option>
                </select>
              </div>
            </div>

            <div className='p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end'>
              <button
                onClick={handleCancel}
                className='px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors'
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className='px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2'
              >
                <Save className='w-4 h-4' />
                {editingVehicle ? 'حفظ التعديلات' : 'إضافة المركبة/الموبايل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View for Mobile */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm col-span-1">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">لا توجد مركبات مطابقة للبحث</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vehicle.status === 'moving' ? 'bg-green-100 text-green-600' :
                    vehicle.status === 'stopped' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {vehicle.status === 'moving' ? <Activity className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{vehicle.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{vehicle.plate}</p>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${vehicle.status === 'moving' ? 'bg-green-500 text-white' :
                  vehicle.status === 'stopped' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                  {getStatusText(vehicle.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">السرعة</p>
                  <p className="font-semibold text-gray-700">{Math.round(vehicle.speed)} كم/س</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">السائق/المالك</p>
                  <p className="font-semibold text-gray-700 truncate">{vehicle.driver || 'غير محدد'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl col-span-2">
                  <p className="text-xs text-gray-400 mb-1">IMEI</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{vehicle.deviceImei}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {vehicle.lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingVehicle(vehicle); setShowAddForm(false); }}
                    className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.id, vehicle.name)}
                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Standard Table for Desktop */}
      <div className='hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <table className='w-full text-sm text-right'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='px-6 py-4 font-semibold text-gray-600'>المركبة/الموبايل</th>
              <th className='px-6 py-4 font-semibold text-gray-600'>المعرف (IMEI)</th>
              <th className='px-6 py-4 font-semibold text-gray-600'>السائق/المالك</th>
              <th className='px-6 py-4 font-semibold text-gray-600 text-center'>الحالة</th>
              <th className='px-6 py-4 font-semibold text-gray-600 text-center'>السرعة</th>
              <th className='px-6 py-4 font-semibold text-gray-600 text-center'>آخر تحديث</th>
              <th className='px-6 py-4 font-semibold text-gray-600 text-center'>تحكم</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className='px-6 py-12 text-center text-gray-400'>
                  <div className="flex flex-col items-center gap-3">
                    <Search className="w-12 h-12 text-gray-200" />
                    <p>لا توجد بيانات مطابقة للبحث</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className='hover:bg-blue-50/50 transition-colors group'>
                  <td className='px-6 py-4'>
                    <div>
                      <p className='font-bold text-gray-900'>{vehicle.name}</p>
                      <p className='text-xs text-gray-500 font-mono mt-0.5'>{vehicle.plate}</p>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-300" />
                      <span className='font-mono text-gray-600 text-xs'>{vehicle.deviceImei}</span>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className="flex flex-col">
                      <span className='text-gray-900 font-medium'>{vehicle.driver}</span>
                      <span className='text-gray-400 text-xs'>{vehicle.driverPhone || '-'}</span>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${vehicle.status === 'moving' ? 'bg-green-100 text-green-700 border border-green-200' :
                        vehicle.status === 'stopped' ? 'bg-red-100 text-red-700 border border-red-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${vehicle.status === 'moving' ? 'bg-green-500 animate-pulse' :
                        vehicle.status === 'stopped' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></span>
                      {getStatusText(vehicle.status)}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <span className="font-mono font-semibold text-gray-700">{Math.round(vehicle.speed)}</span>
                    <span className="text-xs text-gray-400 mr-1">كم/س</span>
                  </td>
                  <td className='px-6 py-4 text-center text-gray-500 text-xs'>
                    {vehicle.lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <div className='flex gap-2 justify-center'>
                      <button
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setShowAddForm(false);
                        }}
                        className='p-2 text-blue-600 hover:opacity-80 transition bg-transparent'
                        title='تعديل'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id, vehicle.name)}
                        className='p-2 text-red-600 hover:opacity-80 transition bg-transparent'
                        title='حذف'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingVehicle && (
        <VehiclesModel
          isOpen={true} // Keep this for legacy or if you want to use the dedicated modal component
          onClose={() => setEditingVehicle(null)}
          vehicle={editingVehicle}
          onSave={handleSaveModal}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        // Note: I'm rendering it but also rendering the internal form above. 
        // To avoid duplication, I will comment this out in the final render or manage state to only show one.
        // For now, removing it from DOM to use the new unified modal above.
        />
      ) && null}
    </div>
  );
}
