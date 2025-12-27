'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, User, Phone, MapPin } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import DriversModel from './DriversModel';

interface Driver {
  id: number;
  name: string;
  phone: string;
  address: string;
  nationalId?: string;
  province?: string;
  birthDate?: string;
  notes?: string;
  vehicles?: Array<{
    id: number;
    name: string;
    plateNumber: string;
  }>;
}

export default function DriversTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب جميع السائقين
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = searchTerm 
        ? `/api/drivers?search=${encodeURIComponent(searchTerm)}`
        : '/api/drivers';
      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        setDrivers(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'حدث خطأ أثناء جلب البيانات' }));
        setError(errorData.error || 'حدث خطأ أثناء جلب السائقين');
        setDrivers([]);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('حدث خطأ أثناء الاتصال بالخادم');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [searchTerm]);

  // حفظ السائق (إضافة أو تحديث)
  const handleSave = async (driver: Driver) => {
    try {
      // التحقق من الحقول المطلوبة
      if (!driver.name || !driver.phone || !driver.address) {
        alert('الاسم ورقم التليفون والعنوان مطلوبون');
        return;
      }

      // التحقق من وجود ID للتحديث
      const isEditing = editingDriver && editingDriver.id && editingDriver.id > 0;
      
      console.log('Saving driver:', { isEditing, editingDriver, driver });
      
      if (isEditing) {
        // تحديث سائق موجود
        const response = await apiFetch(`/api/drivers/${editingDriver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: driver.name,
            phone: driver.phone,
            address: driver.address,
            nationalId: driver.nationalId || null,
            province: driver.province || null,
            birthDate: driver.birthDate || null,
            notes: driver.notes || null
          })
        });

        if (response.ok) {
          await fetchDrivers();
          setEditingDriver(null);
          setShowModal(false);
          alert('تم تحديث السائق بنجاح');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'حدث خطأ أثناء تحديث السائق' }));
          alert(errorData.error || 'حدث خطأ أثناء تحديث السائق');
        }
      } else {
        // إضافة سائق جديد
        const response = await apiFetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: driver.name,
            phone: driver.phone,
            address: driver.address,
            nationalId: driver.nationalId || null,
            province: driver.province || null,
            birthDate: driver.birthDate || null,
            notes: driver.notes || null
          })
        });

        if (response.ok) {
          await fetchDrivers();
          setShowModal(false);
          alert('تم إضافة السائق بنجاح');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'حدث خطأ أثناء إضافة السائق' }));
          alert(errorData.error || 'حدث خطأ أثناء إضافة السائق');
        }
      }
    } catch (error) {
      console.error('Error saving driver:', error);
      alert('حدث خطأ أثناء حفظ السائق');
    }
  };

  // حذف سائق
  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السائق؟')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/drivers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchDrivers();
        alert('تم حذف السائق بنجاح');
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ أثناء حذف السائق');
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      alert('حدث خطأ أثناء حذف السائق');
    }
  };

  // بدء التعديل
  const startEdit = (driver: Driver) => {
    if (!driver || !driver.id) {
      console.error('Invalid driver data:', driver);
      alert('خطأ: بيانات السائق غير صحيحة');
      return;
    }
    setEditingDriver(driver);
    setShowModal(true);
  };

  // إغلاق الـ Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDriver(null);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">إدارة السائقين</h3>
          <p className="text-sm text-gray-600">إضافة وتعديل وحذف السائقين</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setEditingDriver(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة سائق
          </button>
        </div>
      </div>

      {/* جدول السائقين */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={fetchDrivers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <User className="w-16 h-16 text-gray-300" />
              <p className="text-xl font-medium text-gray-600">لا يوجد سائقين</p>
              <p className="text-sm text-gray-400">ابدأ بإضافة سائق جديد</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2">
                <tr>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">#</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">الاسم</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">رقم التليفون</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">العنوان</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">الرقم القومي</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">المحافظة</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">تاريخ الميلاد</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">المركبات</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {drivers.map((driver, index) => (
                  <tr key={driver.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{driver.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{driver.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{driver.address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{driver.nationalId || '-'}</td>
                    <td className="px-4 py-3 text-center">{driver.province || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {driver.birthDate 
                        ? new Date(driver.birthDate).toLocaleDateString('ar-EG')
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {driver.vehicles && driver.vehicles.length > 0 ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {driver.vehicles.length} مركبة
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(driver)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal للإضافة/التعديل */}
      <DriversModel
        isOpen={showModal}
        onClose={handleCloseModal}
        driver={editingDriver}
        onSave={handleSave}
        isEditing={!!editingDriver}
      />
    </div>
  );
}

