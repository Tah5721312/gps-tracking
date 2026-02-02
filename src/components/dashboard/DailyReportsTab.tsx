'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Activity,
  Navigation,
  Truck,
  Clock,
  Filter,
  X,
  RefreshCw,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Car
} from 'lucide-react';
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

export default function DailyReportsTab({
  vehicles,
  onReportUpdate,
}: DailyReportsTabProps) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalTrips: 0,
    avgSpeed: 0,
    totalStops: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
  const [appliedFilterVehicle, setAppliedFilterVehicle] =
    useState<string>('all');
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
  const handleStartDatePickerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const dateValue = e.target.value; // yyyy-mm-dd
    if (dateValue) {
      setTempStartDate(formatDateToDDMMYYYY(dateValue));
    } else {
      setTempStartDate('');
    }
  };

  const handleEndDatePickerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        const [startH, startM] = (appliedStartTime || '00:00')
          .split(':')
          .map(Number);
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
          endDate = new Date(year, month, day, endH || 23, endM || 59, 59, 999);
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
    setCurrentPage(1); // إعادة تعيين الصفحة عند تطبيق فلتر جديد
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
    setCurrentPage(1); // إعادة تعيين الصفحة عند إلغاء الفلتر
  };

  // جلب البيانات عند التحميل الأولي (الكل)
  useEffect(() => {
    fetchAllReports();
  }, []);

  // جلب البيانات عند تطبيق الفلتر
  useEffect(() => {
    // إذا لم يتم تحديد أي تاريخ، استخدم fetchAllReports (يدعم فلتر المركبة)
    if (
      (!appliedStartDate || appliedStartDate === '') &&
      (!appliedEndDate || appliedEndDate === '')
    ) {
      fetchAllReports();
    } else if (appliedStartDate || appliedEndDate) {
      // إذا تم تحديد أي تاريخ (من أو إلى)، تطبيق الفلتر الكامل
      fetchFilteredReports();
    }
  }, [
    appliedFilterVehicle,
    appliedStartDate,
    appliedEndDate,
    appliedStartTime,
    appliedEndTime,
  ]);

  // إعادة توليد التقرير لليوم المحدد
  const regenerateReport = async (vehicleId: number, date: string) => {
    try {
      const response = await apiFetch(
        `/api/reports?vehicleId=${vehicleId}&startDate=${date}&endDate=${date}`
      );
      if (response.ok) {
        // إعادة تحميل البيانات حسب الفلتر المطبق
        if (
          appliedFilterVehicle === 'all' &&
          (!appliedStartDate ||
            !appliedEndDate ||
            appliedStartDate === '' ||
            appliedEndDate === '')
        ) {
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
        const vehicleFromProps = vehicles.find(
          (v) => v.id === report.vehicleId
        );
        const vehicle = vehicleFromReport || vehicleFromProps;
        const driverName =
          report.driverName ||
          vehicleFromReport?.driver?.name ||
          vehicleFromProps?.driver ||
          '-';

        return {
          '#': index + 1,
          التاريخ: new Date(report.date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          }),
          المركبة: vehicle?.name || 'غير معروف',
          السائق: driverName,
          'وقت البداية': report.startTime,
          'وقت النهاية': report.endTime,
          المدة: report.duration,
          'المسافة (كم)': report.distance.toFixed(1),
          'متوسط السرعة (كم/س)': report.avgSpeed.toFixed(1),
          'أقصى سرعة (كم/س)': report.maxSpeed.toFixed(1),
          التوقفات: report.stops,
        };
      });

      // إضافة صف الإحصائيات
      const statsRow = {
        '#': '',
        التاريخ: 'الإحصائيات الإجمالية',
        المركبة: '',
        السائق: '',
        'وقت البداية': '',
        'وقت النهاية': '',
        المدة: '',
        'المسافة (كم)': stats.totalDistance.toFixed(1),
        'متوسط السرعة (كم/س)': Math.round(stats.avgSpeed),
        'أقصى سرعة (كم/س)': '',
        التوقفات: stats.totalStops,
      };

      // إنشاء workbook
      const worksheet = XLSX.utils.json_to_sheet([...exportData, statsRow]);

      // ضبط عرض الأعمدة
      const columnWidths = [
        { wch: 5 }, // #
        { wch: 25 }, // التاريخ
        { wch: 15 }, // المركبة
        { wch: 15 }, // السائق
        { wch: 12 }, // وقت البداية
        { wch: 12 }, // وقت النهاية
        { wch: 12 }, // المدة
        { wch: 12 }, // المسافة
        { wch: 18 }, // متوسط السرعة
        { wch: 15 }, // أقصى سرعة
        { wch: 10 }, // التوقفات
      ];
      worksheet['!cols'] = columnWidths;

      // إنشاء workbook جديد
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'التقارير اليومية');

      // إنشاء اسم الملف مع التاريخ
      const today = new Date();
      const fileName = `التقارير_اليومية_${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;

      // تصدير الملف
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(
        'حدث خطأ أثناء تصدير الملف. تأكد من تثبيت مكتبة xlsx: pnpm add xlsx'
      );
    }
  };

  // حساب Pagination
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = reports.slice(startIndex, endIndex);

  // تغيير الصفحة
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // إعادة تعيين الصفحة عند تغيير التقارير
  useEffect(() => {
    setCurrentPage(1);
  }, [reports.length]);

  return (
    <div className='p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-full'>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            التقارير اليومية
          </h3>
          <p className="text-gray-500 text-sm mt-1">التقارير تُنشأ تلقائياً من المسارات الفعلية للمركبات (TrackingPoints)</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={exportReport}
            className="w-full md:w-auto px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 font-medium"
          >
            <Download className='w-5 h-5' />
            تصدير Excel
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className='text-xs font-semibold text-gray-700 flex items-center gap-1'>
              <Car className="w-3.5 h-3.5 text-gray-400" />
              المركبة/الموبايل
            </label>
            <select
              value={tempFilterVehicle}
              onChange={(e) => setTempFilterVehicle(e.target.value)}
              className='w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm'
            >
              <option value='all'>جميع المركبات/الموبايلات</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id.toString()}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className='text-xs font-semibold text-gray-700 flex items-center gap-1'>
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              من تاريخ
            </label>
            <div className='relative'>
              <input
                type='text'
                value={tempStartDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                  if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
                  setTempStartDate(value);
                }}
                placeholder='dd/mm/yyyy'
                className='w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm'
                maxLength={10}
              />
              <input
                type='date'
                onChange={handleStartDatePickerChange}
                className='absolute right-0 top-0 w-10 h-full opacity-0 cursor-pointer'
              />
              <Calendar className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className='text-xs font-semibold text-gray-700 flex items-center gap-1'>
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              إلى تاريخ
            </label>
            <div className='relative'>
              <input
                type='text'
                value={tempEndDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                  if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
                  setTempEndDate(value);
                }}
                placeholder='dd/mm/yyyy'
                className='w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm'
                maxLength={10}
              />
              <input
                type='date'
                onChange={handleEndDatePickerChange}
                className='absolute right-0 top-0 w-10 h-full opacity-0 cursor-pointer'
              />
              <Calendar className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' />
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <label className='text-xs font-semibold text-gray-700'>بداية</label>
              <input type="time" value={tempStartTime} onChange={(e) => setTempStartTime(e.target.value)} className="w-full px-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className='text-xs font-semibold text-gray-700'>نهاية</label>
              <input type="time" value={tempEndTime} onChange={(e) => setTempEndTime(e.target.value)} className="w-full px-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <button onClick={applyFilter} className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200">
            <Filter className="w-4 h-4" /> تطبيق الفلتر
          </button>
          <button onClick={clearFilter} className="flex-1 md:flex-none px-6 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2 font-medium">
            <X className="w-4 h-4" /> إعادة تعيين
          </button>
          <button onClick={fetchAllReports} className="flex-1 md:flex-none px-6 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition flex items-center justify-center gap-2 font-medium ml-auto">
            <RefreshCw className="w-4 h-4" /> تحديث البيانات
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
        <div className='bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md shadow-blue-200/50'>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-xs font-medium mb-0.5">إجمالي التقارير</p>
              <h3 className="text-2xl font-bold">{stats.totalTrips}</h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className='bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md shadow-emerald-200/50'>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-emerald-100 text-xs font-medium mb-0.5">إجمالي المسافة</p>
              <h3 className="text-2xl font-bold">{stats.totalDistance.toFixed(1)} <span className="text-xs font-normal opacity-80">كم</span></h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Navigation className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className='bg-linear-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white shadow-md shadow-violet-200/50'>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-violet-100 text-xs font-medium mb-0.5">متوسط السرعة</p>
              <h3 className="text-2xl font-bold">{Math.round(stats.avgSpeed)} <span className="text-xs font-normal opacity-80">كم/س</span></h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Truck className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className='bg-linear-to-br from-orange-400 to-red-500 rounded-xl p-4 text-white shadow-md shadow-orange-200/50'>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-orange-100 text-xs font-medium mb-0.5">إجمالي التوقفات</p>
              <h3 className="text-2xl font-bold">{stats.totalStops}</h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* جدول التقارير اليومية */}
      <div className='bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden'>
        {loading ? (
          <div className='p-8 text-center text-gray-500'>
            <div className='flex flex-col items-center gap-3'>
              <div className='animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600'></div>
              <p>جاري التحميل...</p>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            <div className='flex flex-col items-center gap-2'>
              <Calendar className='w-12 h-12 text-gray-300' />
              <p className='text-lg'>لا توجد تقارير</p>
              <p className='text-sm text-gray-400'>
                التقارير تُنشأ تلقائياً من المسارات الفعلية للمركبات
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200'>
                  <tr>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      #
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      التاريخ
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      المركبة/الموبايل
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      المالك / السائق
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      وقت البداية
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      وقت النهاية
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      المدة
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      المسافة (كم)
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      متوسط السرعة
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      أقصى سرعة
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      التوقفات
                    </th>
                    <th className='px-4 py-4 text-center font-bold text-gray-700'>
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {paginatedReports.map((report, index) => {
                    const vehicleFromReport = report.vehicle;
                    const vehicleFromProps = vehicles.find(
                      (v) => v.id === report.vehicleId
                    );
                    const vehicle = vehicleFromReport || vehicleFromProps;
                    const driverName =
                      report.driverName ||
                      vehicleFromReport?.driver?.name ||
                      vehicleFromProps?.driver ||
                      '-';
                    return (
                      <tr
                        key={report.id}
                        className='hover:bg-blue-50 transition-colors border-b border-gray-100'
                      >
                        <td className='px-4 py-3 text-center text-gray-500 font-medium'>
                          {startIndex + index + 1}
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <span className='text-gray-900 font-medium'>
                            {new Date(report.date).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long',
                            })}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <div className='flex items-center justify-center gap-2'>
                            <Truck className='w-4 h-4 text-gray-400' />
                            <span className='text-gray-900 font-medium'>
                              {vehicle?.name || 'غير معروف'}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 py-3 text-center text-gray-600'>
                          {driverName}
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <span className='px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium'>
                            {report.startTime}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium'>
                            {report.endTime}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-center text-gray-600'>
                          {report.duration}
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <span className='text-gray-900 font-bold'>
                            {report.distance.toFixed(1)}
                          </span>
                          <span className='text-gray-500 text-xs mr-1'>كم</span>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <span className='px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium'>
                            {report.avgSpeed.toFixed(1)} كم/س
                          </span>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <span className='px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium'>
                            {report.maxSpeed.toFixed(1)} كم/س
                          </span>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <span className='px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium'>
                            {report.stops}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <button
                            onClick={() =>
                              regenerateReport(report.vehicleId, report.date)
                            }
                            className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition'
                            title='إعادة توليد التقرير'
                          >
                            <RefreshCw className='w-4 h-4' />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className='md:hidden space-y-3 p-4'>
              {paginatedReports.map((report, index) => {
                const vehicleFromReport = report.vehicle;
                const vehicleFromProps = vehicles.find(
                  (v) => v.id === report.vehicleId
                );
                const vehicle = vehicleFromReport || vehicleFromProps;
                const driverName =
                  report.driverName ||
                  vehicleFromReport?.driver?.name ||
                  vehicleFromProps?.driver ||
                  '-';
                return (
                  <div
                    key={report.id}
                    className='bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm'
                  >
                    {/* Header */}
                    <div className='flex justify-between items-start mb-3 pb-3 border-b border-gray-200'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Truck className='w-4 h-4 text-blue-600' />
                          <h4 className='font-bold text-gray-900 text-sm'>
                            {vehicle?.name || 'غير معروف'}
                          </h4>
                        </div>
                        <p className='text-xs text-gray-500 flex items-center gap-1'>
                          <Calendar className='w-3 h-3' />
                          {new Date(report.date).toLocaleDateString('ar-EG', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        {driverName !== '-' && (
                          <p className='text-xs text-gray-600 mt-1 flex items-center gap-1'>
                            <User className='w-3 h-3' />
                            {driverName}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          regenerateReport(report.vehicleId, report.date)
                        }
                        className='p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition'
                        title='إعادة توليد التقرير'
                      >
                        <RefreshCw className='w-4 h-4' />
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className='grid grid-cols-2 gap-2 mb-3'>
                      <div className='bg-green-50 p-2 rounded-lg border border-green-100'>
                        <p className='text-[10px] text-green-600 mb-0.5 font-medium'>
                          وقت البداية
                        </p>
                        <p className='font-bold text-green-800 text-xs'>
                          {report.startTime}
                        </p>
                      </div>
                      <div className='bg-blue-50 p-2 rounded-lg border border-blue-100'>
                        <p className='text-[10px] text-blue-600 mb-0.5 font-medium'>
                          وقت النهاية
                        </p>
                        <p className='font-bold text-blue-800 text-xs'>
                          {report.endTime}
                        </p>
                      </div>
                    </div>

                    {/* Main Stats */}
                    <div className='grid grid-cols-2 gap-2 mb-3'>
                      <div className='bg-gray-50 p-2.5 rounded-lg'>
                        <p className='text-[10px] text-gray-500 mb-1'>المسافة</p>
                        <p className='font-bold text-gray-900 text-sm'>
                          {report.distance.toFixed(1)} <span className='text-xs text-gray-500'>كم</span>
                        </p>
                      </div>
                      <div className='bg-gray-50 p-2.5 rounded-lg'>
                        <p className='text-[10px] text-gray-500 mb-1'>المدة</p>
                        <p className='font-bold text-gray-900 text-sm'>
                          {report.duration}
                        </p>
                      </div>
                    </div>

                    {/* Speed Stats */}
                    <div className='grid grid-cols-3 gap-2'>
                      <div className='bg-purple-50 p-2 rounded-lg border border-purple-100 text-center'>
                        <p className='text-[9px] text-purple-600 mb-0.5'>متوسط</p>
                        <p className='font-bold text-purple-800 text-xs'>
                          {report.avgSpeed.toFixed(0)}
                        </p>
                      </div>
                      <div className='bg-orange-50 p-2 rounded-lg border border-orange-100 text-center'>
                        <p className='text-[9px] text-orange-600 mb-0.5'>أقصى</p>
                        <p className='font-bold text-orange-800 text-xs'>
                          {report.maxSpeed.toFixed(0)}
                        </p>
                      </div>
                      <div className='bg-red-50 p-2 rounded-lg border border-red-100 text-center'>
                        <p className='text-[9px] text-red-600 mb-0.5'>توقفات</p>
                        <p className='font-bold text-red-800 text-xs'>
                          {report.stops}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {reports.length > 0 && totalPages > 1 && (
              <div className='flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50'>
                {/* Info Text - Hidden on mobile */}
                <div className='hidden sm:flex items-center gap-2 text-sm text-gray-600'>
                  <span>
                    عرض {startIndex + 1} - {Math.min(endIndex, reports.length)} من {reports.length} تقرير
                  </span>
                </div>

                {/* Mobile Info - Show page number only */}
                <div className='sm:hidden text-xs text-gray-600'>
                  صفحة {currentPage} من {totalPages}
                </div>

                {/* Pagination Controls */}
                <div className='flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center'>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1 text-xs sm:text-sm ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                      }`}
                  >
                    <ChevronRight className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                    <span className='hidden sm:inline'>السابق</span>
                  </button>

                  {/* Page Numbers - Simplified on mobile */}
                  <div className='flex items-center gap-0.5 sm:gap-1'>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // On mobile, show only first, last, current, and adjacent pages
                      // On desktop, show more pages
                      const showOnMobile =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      const showOnDesktop =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      if (showOnMobile || showOnDesktop) {
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`hidden sm:block px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm min-w-[32px] sm:min-w-[36px] ${currentPage === page
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className='hidden sm:inline px-1 sm:px-2 text-gray-400 text-xs sm:text-sm'>
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    {/* Mobile: Show only current page and dots */}
                    <div className='sm:hidden flex items-center gap-1'>
                      {currentPage > 2 && (
                        <>
                          <button
                            onClick={() => goToPage(1)}
                            className='px-2 py-1.5 rounded-lg bg-white text-gray-700 border border-gray-200 text-xs hover:bg-blue-50'
                          >
                            1
                          </button>
                          {currentPage > 3 && (
                            <span className='px-1 text-gray-400 text-xs'>...</span>
                          )}
                        </>
                      )}
                      {currentPage > 1 && (
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          className='px-2 py-1.5 rounded-lg bg-white text-gray-700 border border-gray-200 text-xs hover:bg-blue-50'
                        >
                          {currentPage - 1}
                        </button>
                      )}
                      <button
                        disabled
                        className='px-2 py-1.5 rounded-lg bg-blue-600 text-white text-xs min-w-[32px]'
                      >
                        {currentPage}
                      </button>
                      {currentPage < totalPages && (
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          className='px-2 py-1.5 rounded-lg bg-white text-gray-700 border border-gray-200 text-xs hover:bg-blue-50'
                        >
                          {currentPage + 1}
                        </button>
                      )}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <span className='px-1 text-gray-400 text-xs'>...</span>
                          )}
                          <button
                            onClick={() => goToPage(totalPages)}
                            className='px-2 py-1.5 rounded-lg bg-white text-gray-700 border border-gray-200 text-xs hover:bg-blue-50'
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1 text-xs sm:text-sm ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                      }`}
                  >
                    <span className='hidden sm:inline'>التالي</span>
                    <ChevronLeft className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
