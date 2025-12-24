'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Send, Play, Pause, Square, Truck } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Vehicle {
  id: number;
  name: string;
  plateNumber: string;
  deviceImei: string;
  driverName: string | null;
}

export default function GPSSimulator() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [sendInterval, setSendInterval] = useState(5); // ثواني
  const [currentLocation, setCurrentLocation] = useState({ lat: 30.0444, lng: 31.2357 });
  const [speed, setSpeed] = useState(0);
  const [battery, setBattery] = useState(100);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [direction, setDirection] = useState(0); // الاتجاه بالدرجات (0-360)

  // جلب المركبات
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await apiFetch('/api/vehicles');
        if (response.ok) {
          const data = await response.json();
          setVehicles(data.vehicles);
          if (data.vehicles.length > 0 && !selectedVehicle) {
            setSelectedVehicle(data.vehicles[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };
    fetchVehicles();
  }, []);

  // استخدام useRef لحفظ القيم الحالية
  const speedRef = useRef(speed);
  const batteryRef = useRef(battery);
  const locationRef = useRef(currentLocation);
  const selectedVehicleRef = useRef(selectedVehicle);

  // تحديث refs عند تغيير القيم
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    batteryRef.current = battery;
  }, [battery]);

  useEffect(() => {
    locationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    selectedVehicleRef.current = selectedVehicle;
  }, [selectedVehicle]);

  // إرسال بيانات GPS - استخدام refs للحصول على القيم الحالية دائماً
  const sendGPSData = useCallback(async () => {
    const vehicle = selectedVehicleRef.current;
    if (!vehicle) {
      setStatus('error');
      setStatusMessage('يرجى اختيار مركبة');
      return;
    }

    setStatus('sending');
    try {
      // استخدام القيم الحالية من refs (دائماً محدثة)
      const response = await apiFetch('/api/gps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceImei: vehicle.deviceImei,
          latitude: locationRef.current.lat,
          longitude: locationRef.current.lng,
          speed: speedRef.current, // القيمة الحالية دائماً
          batteryLevel: batteryRef.current, // القيمة الحالية دائماً
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setStatusMessage('تم إرسال البيانات بنجاح');
        setLastSent(new Date());
      } else {
        setStatus('error');
        setStatusMessage(data.error || 'حدث خطأ في الإرسال');
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage('خطأ في الاتصال بالسيرفر');
      console.error('Error sending GPS data:', error);
    }

    setTimeout(() => {
      setStatus('idle');
      setStatusMessage('');
    }, 2000);
  }, []);

  // محاكاة حركة المركبة
  const moveVehicle = () => {
    if (speed > 0) {
      // حساب المسافة المقطوعة خلال ثانية واحدة (متر)
      const distanceInMeters = speed / 3.6; // السرعة من كم/س إلى م/ث
      
      // تحويل المسافة إلى درجات (تقريبي: 1 درجة ≈ 111 كم = 111000 متر)
      const distanceInDegrees = distanceInMeters / 111000;
      
      // تحديث الاتجاه بشكل عشوائي قليلاً (محاكاة منعطفات)
      let newDirection = direction;
      if (Math.random() > 0.85) {
        // تغيير الاتجاه بزاوية عشوائية بين -45 و +45 درجة
        newDirection = (direction + (Math.random() * 90 - 45) + 360) % 360;
        setDirection(newDirection);
      }
      
      // حساب التغيير في خطوط الطول والعرض بناءً على الاتجاه
      const radians = (newDirection * Math.PI) / 180;
      const latChange = distanceInDegrees * Math.cos(radians);
      // خط الطول يحتاج تصحيح حسب خط العرض (cos(latitude))
      const lngChange = (distanceInDegrees * Math.sin(radians)) / Math.cos(currentLocation.lat * Math.PI / 180);
      
      setCurrentLocation(prev => ({
        lat: prev.lat + latChange,
        lng: prev.lng + lngChange
      }));

      // تقليل البطارية تدريجياً
      if (Math.random() > 0.9) {
        setBattery(prev => Math.max(20, prev - 0.1));
      }
    }
  };

  // تحريك المركبة بشكل مستمر عند السرعة > 0
  useEffect(() => {
    if (!isRunning || speed === 0) return;

    // تحريك المركبة كل ثانية
    const moveInterval = setInterval(() => {
      moveVehicle();
    }, 1000);

    return () => clearInterval(moveInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, speed]);

  // إرسال البيانات تلقائياً
  useEffect(() => {
    // تنظيف interval السابق
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning || !selectedVehicle) return;

    // إرسال أولي
    sendGPSData();
    
    // إعداد interval للإرسال التلقائي
    intervalRef.current = setInterval(() => {
      sendGPSData();
    }, sendInterval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, sendInterval, selectedVehicle, sendGPSData]);

  // إرسال يدوي
  const handleManualSend = () => {
    sendGPSData();
  };

  // إعادة تعيين الموقع
  const resetLocation = () => {
    setCurrentLocation({ lat: 30.0444, lng: 31.2357 });
    setSpeed(0);
    setBattery(100);
    setDirection(Math.random() * 360); // اتجاه عشوائي جديد
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">محاكي GPS</h1>
              <p className="text-sm text-gray-500">محاكاة إرسال بيانات GPS من الأجهزة</p>
            </div>
          </div>

          {/* اختيار المركبة */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر المركبة
            </label>
            <select
              value={selectedVehicle?.id || ''}
              onChange={(e) => {
                const vehicle = vehicles.find(v => v.id === parseInt(e.target.value));
                setSelectedVehicle(vehicle || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isRunning}
            >
              <option value="">-- اختر مركبة --</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} - {vehicle.plateNumber} (IMEI: {vehicle.deviceImei})
                </option>
              ))}
            </select>
          </div>

          {/* إعدادات المحاكي */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفترة بين الإرسال (ثانية)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={sendInterval}
                onChange={(e) => setSendInterval(parseInt(e.target.value) || 5)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السرعة (كم/س)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البطارية (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={battery}
                onChange={(e) => setBattery(parseFloat(e.target.value) || 100)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* الموقع الحالي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                خط العرض (Latitude)
              </label>
              <input
                type="number"
                step="0.000001"
                value={currentLocation.lat}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                خط الطول (Longitude)
              </label>
              <input
                type="number"
                step="0.000001"
                value={currentLocation.lng}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setIsRunning(!isRunning)}
              disabled={!selectedVehicle}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition flex-1 sm:flex-none ${
                isRunning
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>إيقاف</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>تشغيل</span>
                </>
              )}
            </button>

            <button
              onClick={handleManualSend}
              disabled={!selectedVehicle || isRunning}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed flex-1 sm:flex-none"
            >
              <Send className="w-5 h-5" />
              <span className="whitespace-nowrap">إرسال يدوي</span>
            </button>

            <button
              onClick={resetLocation}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition flex-1 sm:flex-none"
            >
              <Square className="w-5 h-5" />
              <span>إعادة تعيين</span>
            </button>
          </div>

          {/* حالة الإرسال */}
          {status !== 'idle' && (
            <div className={`p-3 sm:p-4 rounded-lg mb-4 text-sm sm:text-base ${
              status === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
              status === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <p className="font-medium">
                {status === 'sending' && '⏳ جاري الإرسال...'}
                {status === 'success' && '✅ ' + statusMessage}
                {status === 'error' && '❌ ' + statusMessage}
              </p>
            </div>
          )}

          {/* معلومات الإرسال الأخير */}
          {lastSent && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>آخر إرسال:</strong> {lastSent.toLocaleString('ar-EG')}
              </p>
              {selectedVehicle && (
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>المركبة:</strong> {selectedVehicle.name} ({selectedVehicle.plateNumber})</p>
                  <p><strong>IMEI:</strong> {selectedVehicle.deviceImei}</p>
                  <p><strong>الموقع:</strong> {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</p>
                  <p><strong>السرعة:</strong> {speed} كم/س</p>
                  <p><strong>البطارية:</strong> {battery.toFixed(1)}%</p>
                </div>
              )}
            </div>
          )}

          {/* معلومات إضافية */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">💡 نصائح:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>اختر مركبة من القائمة أولاً</li>
              <li>اضبط السرعة لتتحرك المركبة تلقائياً على الخريطة</li>
              <li>يمكنك تغيير الموقع يدوياً أو تركه يتحرك تلقائياً</li>
              <li>استخدم "إرسال يدوي" لإرسال بيانات واحدة</li>
              <li>استخدم "تشغيل" لإرسال البيانات تلقائياً كل {sendInterval} ثانية</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

