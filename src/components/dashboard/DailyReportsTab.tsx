'use client';

import React, { useState, useEffect } from 'react';
import { Download, Activity, Navigation, Truck, Clock, Filter, X, RefreshCw, Calendar, CalendarDays } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Vehicle {
  id: number;
  name: string;
  plate: string;
  deviceImei: string;
  driver: string;
}

interface DailyReport {
  id: number;
  vehicleId: number;
  date: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: string;
  stops: number;
  avgSpeed: number;
  maxSpeed: number;
  vehicle?: {
    id: number;
    name: string;
    plateNumber: string;
    driver?: {
      id: number;
      name: string;
      phone: string;
    };
  };
  driverName?: string | null;
}

interface DailyReportsTabProps {
  vehicles: Vehicle[];
  onReportUpdate?: () => void;
}

export default function DailyReportsTab({ vehicles, onReportUpdate }: DailyReportsTabProps) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalTrips: 0,
    avgSpeed: 0,
    totalStops: 0
  });

  // دالة للحصول على تاريخ اليوم بتنسيق dd/mm/yyyy
  const getTodayDate = (): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // فلاتر مؤقتة (قبل التطبيق)
  const [tempFilterVehicle, setTempFilterVehicle] = useState<string>('all');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>(getTodayDate());
  const [tempStartTime, setTempStartTime] = useState<string>('');
  const [tempEndTime, setTempEndTime] = useState<string>('');

  // فلاتر مطبقة (الفعلية)
  const [appliedFilterVehicle, setAppliedFilterVehicle] = useState<string>('all');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>(getTodayDate());
  const [appliedStartTime, setAppliedStartTime] = useState<string>('');
  const [appliedEndTime, setAppliedEndTime] = useState<string>('');

  // دالة لتحويل من yyyy-mm-dd إلى dd/mm/yyyy
  const formatDateToDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };
  
  // دالة لتحويل من dd/mm/yyyy إلى yyyy-mm-dd
  const formatDateToYYYYMMDD = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };
  
  // معالجة اختيار التاريخ من date picker
  const handleStartDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value; // yyyy-mm-dd
    if (dateValue) {
      setTempStartDate(formatDateToDDMMYYYY(dateValue));
    } else {
      setTempStartDate('');
    }
  };
  
  const handleEndDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value; // yyyy-mm-dd
    if (dateValue) {
      setTempEndDate(formatDateToDDMMYYYY(dateValue));
    } else {
      setTempEndDate('');
    }
  };

  // جلب جميع التقارير (بدون فلتر تاريخ، لكن مع فلتر المركبة إن وجد)
  const fetchAllReports = async () => {
    try {
      setLoading(true);
      let url = '/api/reports';
      if (appliedFilterVehicle !== 'all') {
        url += `?vehicleId=${appliedFilterVehicle}`;
      }
      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        setReports(data.trips || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // جلب التقارير مع الفلتر
  const fetchFilteredReports = async () => {
    try {
      setLoading(true);
      let url = '/api/reports?';
      if (appliedFilterVehicle !== 'all') {
        url += `vehicleId=${appliedFilterVehicle}&`;
      }

      // بناء التواريخ مع وقت البداية والنهاية
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      // نطاق من تاريخ لآخر - دعم اختيار واحد أو كلاهما
      if (appliedStartDate && appliedStartDate !== '') {
        const [startH, startM] = (appliedStartTime || '00:00').split(':').map(Number);
        // تحويل من dd/mm/yyyy إلى Date
        const startDateParts = appliedStartDate.split('/');
        if (startDateParts.length === 3) {
          const day = parseInt(startDateParts[0]);
          const month = parseInt(startDateParts[1]) - 1; // الشهر يبدأ من 0 في JavaScript
          const year = parseInt(startDateParts[2]);
          startDate = new Date(
            year,
            month,
            day,
            startH || 0,
            startM || 0,
            0,
            0
          );
        }
      }

      if (appliedEndDate && appliedEndDate !== '') {
        const [endH, endM] = (appliedEndTime || '23:59').split(':').map(Number);
        // تحويل من dd/mm/yyyy إلى Date
        const endDateParts = appliedEndDate.split('/');
        if (endDateParts.length === 3) {
          const day = parseInt(endDateParts[0]);
          const month = parseInt(endDateParts[1]) - 1; // الشهر يبدأ من 0 في JavaScript
          const year = parseInt(endDateParts[2]);
          endDate = new Date(
            year,
            month,
            day,
            endH || 23,
            endM || 59,
            59,
            999
          );
        }
      }

      // إذا لم يتم تحديد أي تاريخ، لا تطبق فلتر
      if (!startDate && !endDate) {
        setLoading(false);
        return;
      }

      // إذا تم تحديد تاريخ واحد فقط، استخدم قيم افتراضية للآخر
      if (startDate && !endDate) {
        // إذا اختار "من تاريخ" فقط، اجلب كل ما هو أكبر من أو يساوي هذا التاريخ
        endDate = new Date(2100, 11, 31, 23, 59, 59, 999); // تاريخ بعيد جداً
      } else if (!startDate && endDate) {
        // إذا اختار "إلى تاريخ" فقط، اجلب كل ما هو أصغر من أو يساوي هذا التاريخ
        startDate = new Date(2000, 0, 1, 0, 0, 0, 0); // تاريخ قديم جداً
      }

      if (startDate) {
        url += `startDate=${startDate.toISOString()}`;
      }
      if (endDate) {
        if (startDate) url += '&';
        url += `endDate=${endDate.toISOString()}`;
      }
      if (appliedStartTime && appliedStartTime !== '') {
        url += `&startTime=${appliedStartTime}`;
      }
      if (appliedEndTime && appliedEndTime !== '') {
        url += `&endTime=${appliedEndTime}`;
      }

      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        setReports(data.trips || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // تطبيق الفلتر
  const applyFilter = () => {
    setAppliedFilterVehicle(tempFilterVehicle);
    setAppliedStartDate(tempStartDate);
    setAppliedEndDate(tempEndDate);
    setAppliedStartTime(tempStartTime);
    setAppliedEndTime(tempEndTime);
  };

  // إلغاء الفلتر (عرض الكل)
  const clearFilter = () => {
    const todayDate = getTodayDate();
    setTempFilterVehicle('all');
    setTempStartDate('');
    setTempEndDate(todayDate);
    setTempStartTime('');
    setTempEndTime('');
    
    setAppliedFilterVehicle('all');
    setAppliedStartDate('');
    setAppliedEndDate(todayDate);
    setAppliedStartTime('');
    setAppliedEndTime('');
  };

  // جلب البيانات عند التحميل الأولي (الكل)
  useEffect(() => {
    fetchAllReports();
  }, []);

  // جلب البيانات عند تطبيق الفلتر
  useEffect(() => {
    // إذا لم يتم تحديد أي تاريخ، استخدم fetchAllReports (يدعم فلتر المركبة)
    if ((!appliedStartDate || appliedStartDate === '') &&
      (!appliedEndDate || appliedEndDate === '')) {
      fetchAllReports();
    } else if (appliedStartDate || appliedEndDate) {
      // إذا تم تحديد أي تاريخ (من أو إلى)، تطبيق الفلتر الكامل
      fetchFilteredReports();
    }
  }, [appliedFilterVehicle, appliedStartDate, appliedEndDate, appliedStartTime, appliedEndTime]);

  // إعادة توليد التقرير لليوم المحدد
  const regenerateReport = async (vehicleId: number, date: string) => {
    try {
      const response = await apiFetch(`/api/reports?vehicleId=${vehicleId}&startDate=${date}&endDate=${date}`);
      if (response.ok) {
        // إعادة تحميل البيانات حسب الفلتر المطبق
        if (appliedFilterVehicle === 'all' &&
          (!appliedStartDate || !appliedEndDate || appliedStartDate === '' || appliedEndDate === '')) {
          fetchAllReports();
        } else if (appliedStartDate && appliedEndDate) {
          fetchFilteredReports();
        }
        if (onReportUpdate) {
          onReportUpdate();
        }
        alert('تم تحديث التقرير بنجاح');
      }
    } catch (error) {
      console.error('Error regenerating report:', error);
      alert('حدث خطأ أثناء تحديث التقرير');
    }
  };

  // تصدير Excel
  const exportReport = async () => {
    try {
      // ديناميكي استيراد مكتبة xlsx
      // @ts-ignore - xlsx library types
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule.default || XLSXModule;
      
      // تحضير البيانات للتصدير
      const exportData = reports.map((report, index) => {
        const vehicleFromReport = report.vehicle;
        const vehicleFromProps = vehicles.find(v => v.id === report.vehicleId);
        const vehicle = vehicleFromReport || vehicleFromProps;
        const driverName = report.driverName || vehicleFromReport?.driver?.name || vehicleFromProps?.driver || '-';
        
        return {
          '#': index + 1,
          'التاريخ': new Date(report.date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          }),
          'المركبة': vehicle?.name || 'غير معروف',
          'السائق': driverName,
          'وقت البداية': report.startTime,
          'وقت النهاية': report.endTime,
          'المدة': report.duration,
          'المسافة (كم)': report.distance.toFixed(1),
          'متوسط السرعة (كم/س)': report.avgSpeed.toFixed(1),
          'أقصى سرعة (كم/س)': report.maxSpeed.toFixed(1),
          'التوقفات': report.stops
        };
      });

      // إضافة صف الإحصائيات
      const statsRow = {
        '#': '',
        'التاريخ': 'الإحصائيات الإجمالية',
        'المركبة': '',
        'السائق': '',
        'وقت البداية': '',
        'وقت النهاية': '',
        'المدة': '',
        'المسافة (كم)': stats.totalDistance.toFixed(1),
        'متوسط السرعة (كم/س)': Math.round(stats.avgSpeed),
        'أقصى سرعة (كم/س)': '',
        'التوقفات': stats.totalStops
      };

      // إنشاء workbook
      const worksheet = XLSX.utils.json_to_sheet([...exportData, statsRow]);
      
      // ضبط عرض الأعمدة
      const columnWidths = [
        { wch: 5 },   // #
        { wch: 25 },  // التاريخ
        { wch: 15 },  // المركبة
        { wch: 15 },  // السائق
        { wch: 12 },  // وقت البداية
        { wch: 12 },  // وقت النهاية
        { wch: 12 },  // المدة
        { wch: 12 },  // المسافة
        { wch: 18 },  // متوسط السرعة
        { wch: 15 },  // أقصى سرعة
        { wch: 10 }   // التوقفات
      ];
      worksheet['!cols'] = columnWidths;

      // إنشاء workbook جديد
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'التقارير اليومية');

      // إنشاء اسم الملف مع التاريخ
      const today = new Date();
      const fileName = `التقارير_اليومية_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;

      // تصدير الملف
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء تصدير الملف. تأكد من تثبيت مكتبة xlsx: pnpm add xlsx');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">التقارير اليومية</h3>
          <p className="text-sm text-gray-600 mb-4">
            التقارير تُنشأ تلقائياً من المسارات الفعلية للمركبات (TrackingPoints)
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">المركبة:</label>
              <select
                value={tempFilterVehicle}
                onChange={(e) => setTempFilterVehicle(e.target.value)}
                className="px-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                <option value="all">جميع المركبات</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id.toString()}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">من تاريخ:</label>
              <div className="relative">
                <input
                  type="text"
                  value={tempStartDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ''); // إزالة كل شيء ما عدا الأرقام
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2);
                    }
                    if (value.length >= 5) {
                      value = value.slice(0, 5) + '/' + value.slice(5, 9);
                    }
                    setTempStartDate(value);
                  }}
                  placeholder="dd/mm/yyyy"
                  pattern="\d{2}/\d{2}/\d{4}"
                  maxLength={10}
                  className="px-10 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <CalendarDays className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  onChange={handleStartDatePickerChange}
                  className="absolute right-0 top-0 w-10 h-full opacity-0 cursor-pointer z-10"
                  title="اختر التاريخ"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">إلى تاريخ:</label>
              <div className="relative">
                <input
                  type="text"
                  value={tempEndDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ''); // إزالة كل شيء ما عدا الأرقام
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2);
                    }
                    if (value.length >= 5) {
                      value = value.slice(0, 5) + '/' + value.slice(5, 9);
                    }
                    setTempEndDate(value);
                  }}
                  placeholder="dd/mm/yyyy"
                  pattern="\d{2}/\d{2}/\d{4}"
                  maxLength={10}
                  className="px-10 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <CalendarDays className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  onChange={handleEndDatePickerChange}
                  min={tempStartDate ? formatDateToYYYYMMDD(tempStartDate) : undefined}
                  className="absolute right-0 top-0 w-10 h-full opacity-0 cursor-pointer z-10"
                  title="اختر التاريخ"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">وقت البداية:</label>
              <input
                type="time"
                value={tempStartTime}
                onChange={(e) => setTempStartTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">وقت النهاية:</label>
              <input
                type="time"
                value={tempEndTime}
                onChange={(e) => setTempEndTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            تطبيق الفلتر
          </button>
          <button
            onClick={clearFilter}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            عرض الكل
          </button>
          <button
            onClick={fetchAllReports}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            تصدير Excel
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">إجمالي التقارير</p>
              <p className="text-3xl font-bold">{stats.totalTrips}</p>
            </div>
            <Activity className="w-12 h-12 opacity-20" />
          </div>
        </div>
        <div className="bg-linear-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">إجمالي المسافة</p>
              <p className="text-3xl font-bold">{stats.totalDistance.toFixed(1)} كم</p>
            </div>
            <Navigation className="w-12 h-12 opacity-20" />
          </div>
        </div>
        <div className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">متوسط السرعة</p>
              <p className="text-3xl font-bold">{Math.round(stats.avgSpeed)} كم/س</p>
            </div>
            <Truck className="w-12 h-12 opacity-20" />
          </div>
        </div>
        <div className="bg-linear-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">إجمالي التوقفات</p>
              <p className="text-3xl font-bold">{stats.totalStops}</p>
            </div>
            <Clock className="w-12 h-12 opacity-20" />
          </div>
        </div>
      </div>

      {/* جدول التقارير اليومية */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2">
                <tr>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">#</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">التاريخ</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">المركبة</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">السائق</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">وقت البداية</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">وقت النهاية</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">المدة</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">المسافة (كم)</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">متوسط السرعة</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">أقصى سرعة</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">التوقفات</th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-12 h-12 text-gray-300" />
                        <p className="text-lg">لا توجد تقارير</p>
                        <p className="text-sm text-gray-400">التقارير تُنشأ تلقائياً من المسارات الفعلية للمركبات</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((report, index) => {
                    const vehicleFromReport = report.vehicle;
                    const vehicleFromProps = vehicles.find(v => v.id === report.vehicleId);
                    const vehicle = vehicleFromReport || vehicleFromProps;
                    const driverName = report.driverName || vehicleFromReport?.driver?.name || vehicleFromProps?.driver || '-';
                    return (
                      <tr key={report.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-900 font-medium">
                            {new Date(report.date).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{vehicle?.name || 'غير معروف'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{driverName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {report.startTime}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {report.endTime}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{report.duration}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-900 font-bold">{report.distance.toFixed(1)}</span>
                          <span className="text-gray-500 text-xs mr-1">كم</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {report.avgSpeed.toFixed(1)} كم/س
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            {report.maxSpeed.toFixed(1)} كم/س
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            {report.stops}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => regenerateReport(report.vehicleId, report.date)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="إعادة توليد التقرير"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
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

