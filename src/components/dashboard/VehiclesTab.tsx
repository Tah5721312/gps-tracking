'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
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
        alert('حدث خطأ أثناء تحديث المركبة');
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
          alert(error.error || 'حدث خطأ أثناء إضافة المركبة');
        }
      } catch (error) {
        console.error('Error adding vehicle:', error);
        alert('حدث خطأ أثناء إضافة المركبة');
      }
    }
  };

  const handleDelete = async (vehicleId: number, vehicleName: string) => {
    if (confirm(`هل أنت متأكد من حذف المركبة "${vehicleName}"؟`)) {
      try {
        const response = await apiFetch(`/api/vehicles/${vehicleId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          onVehicleUpdate();
        } else {
          alert('حدث خطأ أثناء حذف المركبة');
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('حدث خطأ أثناء حذف المركبة');
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
        alert('حدث خطأ أثناء تحديث المركبة');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('حدث خطأ أثناء تحديث المركبة');
    }
  };

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h3 className='text-xl font-bold text-gray-900'>
          إدارة المركبات/الموبايلات
        </h3>
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
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2'
        >
          <Plus className='w-4 h-4' />
          إضافة مركبة /موبايل
        </button>
      </div>

      {/* نموذج إضافة/تعديل مركبة */}
      {(showAddForm || editingVehicle) && (
        <div className='mb-6 p-6 bg-white rounded-lg border-2 border-blue-300 shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h4 className='text-lg font-bold text-gray-900'>
              {editingVehicle ? 'تعديل مركبة/الموبايل' : 'إضافة مركبة/الموبايل'}
            </h4>
            <button
              onClick={handleCancel}
              className='text-gray-500 hover:text-gray-700'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                اسم المركبة *
              </label>
              <input
                type='text'
                value={editingVehicle ? editingVehicle.name : formData.name}
                onChange={(e) => {
                  if (editingVehicle) {
                    setEditingVehicle({
                      ...editingVehicle,
                      name: e.target.value,
                    });
                  } else {
                    setFormData({ ...formData, name: e.target.value });
                  }
                }}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='مثال: شاحنة 1'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                رقم اللوحة
              </label>
              <input
                type='text'
                value={
                  editingVehicle ? editingVehicle.plate : formData.plateNumber
                }
                onChange={(e) => {
                  if (editingVehicle) {
                    setEditingVehicle({
                      ...editingVehicle,
                      plate: e.target.value,
                    });
                  } else {
                    setFormData({ ...formData, plateNumber: e.target.value });
                  }
                }}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='مثال: ABC-123'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                IMEI الجهاز *
              </label>
              <input
                type='text'
                value={
                  editingVehicle
                    ? editingVehicle.deviceImei
                    : formData.deviceImei
                }
                onChange={(e) => {
                  if (editingVehicle) {
                    setEditingVehicle({
                      ...editingVehicle,
                      deviceImei: e.target.value,
                    });
                  } else {
                    setFormData({ ...formData, deviceImei: e.target.value });
                  }
                }}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='مثال: 123456789012345'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                السائق/المالك *
              </label>
              <select
                value={
                  editingVehicle
                    ? editingVehicle.driverId || ''
                    : formData.driverId || ''
                }
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
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>-- اختر سائق --</option>
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
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                حالة المركبة/الموبايل
              </label>
              <select
                value={
                  editingVehicle ? editingVehicle.status : formData.status
                }
                onChange={(e) => {
                  if (editingVehicle) {
                    setEditingVehicle({
                      ...editingVehicle,
                      status: e.target.value as 'moving' | 'stopped' | 'turnoff',
                    });
                  } else {
                    setFormData({
                      ...formData,
                      status: e.target.value as 'moving' | 'stopped' | 'turnoff',
                    });
                  }
                }}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='turnoff'>مطفأة</option>
                <option value='stopped'>متوقفة</option>
                <option value='moving'>متحركة</option>
              </select>
            </div>
          </div>
          <div className='mt-4 flex gap-2 justify-end'>
            <button
              onClick={handleSave}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2'
            >
              <Save className='w-4 h-4' />
              {editingVehicle ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              onClick={handleCancel}
              className='px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition'
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* جدول المركبات */}
      <div className='overflow-x-auto rounded-lg border bg-white'>
        <table className='w-full text-sm'>
          <thead className='bg-gray-100 border-b-2'>
            <tr>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                اسم المركبة/الموبايل
              </th>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                رقم اللوحة
              </th>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                IMEI
              </th>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                السائق/المالك
              </th>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                رقم الهاتف{' '}
              </th>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                الحالة
              </th>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                أخر سرعة
              </th>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                آخر تحديث
              </th>
              <th className='px-4 py-3 text-center font-bold text-gray-700'>
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={9} className='px-4 py-8 text-center text-gray-500'>
                  لا توجد مركبات
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className='hover:bg-gray-50'>
                  <td className='px-4 py-3 text-center text-gray-900 font-medium'>
                    {vehicle.name}
                  </td>
                  <td className='px-4 py-3 text-center text-gray-600'>
                    {vehicle.plate}
                  </td>
                  <td className='px-4 py-3 text-center text-gray-600 text-xs'>
                    {vehicle.deviceImei}
                  </td>
                  <td className='px-4 py-3 text-center text-gray-600'>
                    {vehicle.driver}
                  </td>
                  <td className='px-4 py-3 text-center text-gray-600'>
                    {vehicle.driverPhone || '-'}
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(
                        vehicle.status
                      )}`}
                    >
                      {getStatusText(vehicle.status)}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-center text-gray-600'>
                    {Math.round(vehicle.speed)} كم/س
                  </td>
                  <td className='px-4 py-3 text-center text-gray-600 text-xs'>
                    {vehicle.lastUpdate.toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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

      {/* Modal للتعديل */}
      <VehiclesModel
        isOpen={editingVehicle !== null}
        onClose={() => setEditingVehicle(null)}
        vehicle={editingVehicle}
        onSave={handleSaveModal}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
      />
    </div>
  );
}
