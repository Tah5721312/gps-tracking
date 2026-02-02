'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, User, Phone, MapPin, Calendar, CreditCard, UserPlus, Users } from 'lucide-react';
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
        } else {
          const errorData = await response.json().catch(() => ({ error: 'حدث خطأ أثناء تحديث السائق/المالك' }));
          alert(errorData.error || 'حدث خطأ أثناء تحديث السائق/المالك');
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
        } else {
          const errorData = await response.json().catch(() => ({ error: 'حدث خطأ أثناء إضافة السائق/المالك' }));
          alert(errorData.error || 'حدث خطأ أثناء إضافة السائق/المالك');
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
      } else {
        const error = await response.json();
        alert(error.error || 'حدث خطأ أثناء حذف السائق/المالك');
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      alert('حدث خطأ أثناء حذف السائق/المالك');
    }
  };

  // بدء التعديل
  const startEdit = (driver: Driver) => {
    if (!driver || !driver.id) {
      console.error('Invalid driver data:', driver);
      alert('خطأ: بيانات السائق/المالك غير صحيحة');
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
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            إدارة السائقين والمستخدمين
          </h3>
          <p className="text-gray-500 text-sm mt-1">إدارة بيانات السائقين، العناوين، وجهات الاتصال</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="بحث باسم السائق أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400 text-sm"
            />
          </div>
          <button
            onClick={() => {
              setEditingDriver(null);
              setShowModal(true);
            }}
            className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 font-medium"
          >
            <UserPlus className="w-5 h-5" />
            إضافة سائق جديد
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-100">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDrivers}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-gray-300" />
            </div>
            <h4 className="text-xl font-medium text-gray-900">لا يوجد سائقين حالياً</h4>
            <p className="text-gray-500 max-w-sm mx-auto">لم يتم إضافة أي سائقين للنظام بعد. قم بإضافة سائق جديد للبدء.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              إضافة سائق الآن
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Grid View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {drivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{driver.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {driver.province || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(driver)}
                      className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(driver.id)}
                      className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span dir="ltr">{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{driver.address}</span>
                  </div>
                  {driver.nationalId && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="font-mono">{driver.nationalId}</span>
                    </div>
                  )}
                </div>

                {driver.vehicles && driver.vehicles.length > 0 ? (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">المركبات المرتبطة:</p>
                    <div className="flex flex-wrap gap-2">
                      {driver.vehicles.map(v => (
                        <span key={v.id} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                          {v.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">لا توجد مركبات مرتبطة</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-start font-semibold text-gray-600">اسم السائق/المالك</th>
                  <th className="px-6 py-4 text-start font-semibold text-gray-600">رقم الهاتف</th>
                  <th className="px-6 py-4 text-start font-semibold text-gray-600">العنوان</th>
                  <th className="px-6 py-4 text-start font-semibold text-gray-600">البيانات الشخصية</th>
                  <th className="px-6 py-4 text-start font-semibold text-gray-600">المركبات</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{driver.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{driver.province || 'المحافظة غير محددة'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span dir="ltr" className="font-mono">{driver.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 text-gray-700 max-w-xs">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="truncate">{driver.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {driver.nationalId && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CreditCard className="w-3 h-3 text-gray-400" />
                            <span className="font-mono">{driver.nationalId}</span>
                          </div>
                        )}
                        {driver.birthDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{new Date(driver.birthDate).toLocaleDateString('ar-EG')}</span>
                          </div>
                        )}
                        {(!driver.nationalId && !driver.birthDate) && <span className="text-gray-400 text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {driver.vehicles && driver.vehicles.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {driver.vehicles.map(v => (
                            <span key={v.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                              {v.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">لا توجد مركبات</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(driver)}
                          className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
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
        </>
      )}

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
