'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Calendar, Clock, Play, RotateCw, ChevronRight, ChevronLeft, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import type L from 'leaflet';
import { apiFetch } from '@/lib/api';

interface VehicleInfo {
  id: number;
  name: string;
  plateNumber?: string;
  driverName?: string;
}

interface TrackingPoint {
  id: number;
  latitude: number;
  longitude: number;
  speed: number;
  batteryLevel: number;
  timestamp: string;
}

interface MovementDay {
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  count: number;
  movingCount: number;
}

function PlaybackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');

  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>('00:00');
  const [endTime, setEndTime] = useState<string>('23:59');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showFinishedModal, setShowFinishedModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [movementDays, setMovementDays] = useState<MovementDay[]>([]);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);

  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const baselinePolylineRef = useRef<L.Polyline | null>(null);
  const playbackPolylineRef = useRef<L.Polyline | null>(null);
  const stopMarkersRef = useRef<L.CircleMarker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const playbackTimerRef = useRef<number | null>(null);

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [selectedDate]);

  const buildDateTimeRange = () => {
    const base = new Date(selectedDate);
    const start = new Date(base);
    const end = new Date(base);

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    start.setHours(startH || 0, startM || 0, 0, 0);
    end.setHours(endH || 23, endM || 59, 59, 999);

    return { start, end };
  };

  const clearPlaybackTimer = () => {
    if (playbackTimerRef.current) {
      window.clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  const clearMapLayers = () => {
    if (baselinePolylineRef.current && mapRef.current) {
      mapRef.current.removeLayer(baselinePolylineRef.current);
      baselinePolylineRef.current = null;
    }
    if (playbackPolylineRef.current && mapRef.current) {
      mapRef.current.removeLayer(playbackPolylineRef.current);
      playbackPolylineRef.current = null;
    }
    if (stopMarkersRef.current.length && mapRef.current) {
      stopMarkersRef.current.forEach(marker => mapRef.current?.removeLayer(marker));
      stopMarkersRef.current = [];
    }
  };

  const fitMapToPoints = (coords: [number, number][]) => {
    if (!mapRef.current || !leafletRef.current || coords.length === 0) return;
    const L = leafletRef.current;
    const bounds = L.latLngBounds(coords);
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  const drawBaselineRoute = (coords: [number, number][]) => {
    if (!mapRef.current || !leafletRef.current || coords.length === 0) return;
    const L = leafletRef.current;
    if (baselinePolylineRef.current) {
      mapRef.current.removeLayer(baselinePolylineRef.current);
    }
    baselinePolylineRef.current = L.polyline(coords, {
      color: '#9ca3af',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 6'
    }).addTo(mapRef.current);
  };

  const addStopMarkers = (points: TrackingPoint[]) => {
    if (!mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    stopMarkersRef.current = points
      .filter(p => p.speed <= 1)
      .map(p => {
        const marker = L.circleMarker([p.latitude, p.longitude], {
          radius: 6,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.9
        }).addTo(mapRef.current!);
        marker.bindTooltip('توقف', { direction: 'top', offset: [0, -4] });
        return marker;
      });
  };

  const stopPlayback = () => {
    clearPlaybackTimer();
    setIsPlaying(false);
  };

  const finishPlayback = () => {
    clearPlaybackTimer();
    setIsPlaying(false);
    setShowFinishedModal(true);
  };

  const startPlayback = () => {
    if (!mapRef.current || !leafletRef.current || trackingPoints.length === 0) return;
    if (trackingPoints.length === 1) {
      setCurrentIndex(0);
      setShowFinishedModal(true);
      return;
    }

    clearPlaybackTimer();
    setShowFinishedModal(false);

    const L = leafletRef.current;
    const coords = trackingPoints.map(p => [p.latitude, p.longitude]) as [number, number][];

    if (playbackPolylineRef.current) {
      mapRef.current.removeLayer(playbackPolylineRef.current);
    }
    playbackPolylineRef.current = L.polyline([coords[0]], {
      color: '#2563eb',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(mapRef.current);

    if (!markerRef.current) {
      markerRef.current = L.marker(coords[0]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(coords[0]);
    }

    setCurrentIndex(0);
    setIsPlaying(true);

    let idx = 0;
    playbackTimerRef.current = window.setInterval(() => {
      idx += 1;
      if (idx >= coords.length) {
        finishPlayback();
        return;
      }
      const coord = coords[idx];
      markerRef.current?.setLatLng(coord);
      playbackPolylineRef.current?.addLatLng(coord);
      mapRef.current?.panTo(coord, { animate: true });
      setCurrentIndex(idx);
    }, 800);
  };

  const fetchVehicle = async () => {
    if (!vehicleId) return;
    try {
      const response = await apiFetch(`/api/vehicles/${vehicleId}`);
      if (!response.ok) return;
      const data = await response.json();
      setVehicle({
        id: data.vehicle.id,
        name: data.vehicle.name,
        plateNumber: data.vehicle.plateNumber,
        driverName: data.vehicle.driverName
      });
    } catch (err) {
      console.error('Error fetching vehicle info', err);
    }
  };

  const fetchMovementDays = async () => {
    if (!vehicleId) return;
    try {
      const res = await apiFetch(`/api/tracking/summary?vehicleId=${vehicleId}&days=30`);
      if (!res.ok) return;
      const data = await res.json();
      const days: MovementDay[] = (data.days || []).map((d: any) => ({
        date: d.date,
        start: d.start,
        end: d.end,
        count: d.count,
        movingCount: d.movingCount,
      }));
      setMovementDays(days);
    } catch (err) {
      console.error('Error fetching movement days', err);
    }
  };

  const fetchTrackingPoints = async () => {
    if (!vehicleId) return;
    const { start, end } = buildDateTimeRange();

    if (end < start) {
      setError('وقت النهاية يجب أن يكون بعد وقت البداية');
      return;
    }

    setError(null);
    setIsLoading(true);
    stopPlayback();
    clearMapLayers();

    try {
      const response = await apiFetch(
        `/api/tracking?vehicleId=${vehicleId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=2000`
      );
      if (!response.ok) {
        throw new Error('فشل في جلب نقاط المسار');
      }
      const data = await response.json();
      const points: TrackingPoint[] = (data.trackingPoints || []).sort(
        (a: TrackingPoint, b: TrackingPoint) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setTrackingPoints(points);
      setCurrentIndex(0);

      if (points.length && mapRef.current) {
        const coords = points.map((p: TrackingPoint) => [p.latitude, p.longitude]) as [number, number][];
        drawBaselineRoute(coords);
        addStopMarkers(points);
        fitMapToPoints(coords);
        if (!markerRef.current) {
          markerRef.current = leafletRef.current!.marker(coords[0]).addTo(mapRef.current);
        } else {
          markerRef.current.setLatLng(coords[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching tracking points', err);
      setError(err?.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // تهيئة الخريطة
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;
    const init = async () => {
      try {
        await import('leaflet/dist/leaflet.css');
        const leaflet = await import('leaflet');
        const L = leaflet.default;
        leafletRef.current = L;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
        });

        if (!mapContainerRef.current) return;
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([30.0444, 31.2357], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapRef.current);
      } catch (err) {
        console.error('Error initializing map', err);
      }
    };
    init();

    return () => {
      clearPlaybackTimer();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // جلب بيانات المركبة عند الدخول
  useEffect(() => {
    if (vehicleId) {
      fetchVehicle();
      fetchMovementDays();
    } else {
      router.push('/dashboard');
    }
  }, [vehicleId]);

  const handleDayChange = (delta: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const progressPercent = useMemo(() => {
    if (!trackingPoints.length) return 0;
    return Math.min(100, Math.round((currentIndex / (trackingPoints.length - 1)) * 100));
  }, [currentIndex, trackingPoints.length]);

  const formatRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) => d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return `${fmt(s)} - ${fmt(e)}`;
  };

  const monthLabel = useMemo(
    () =>
      new Date(filterYear, filterMonth - 1, 1).toLocaleDateString('ar-EG', {
        month: 'long',
        year: 'numeric'
      }),
    [filterYear, filterMonth]
  );

  const filteredMovementDays = useMemo(() => {
    return movementDays.filter(d => {
      const [year, month] = d.date.split('-').map(Number);
      return year === filterYear && month === filterMonth;
    });
  }, [movementDays, filterMonth, filterYear]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50" dir="rtl">
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-white/80 rounded-xl transition-all duration-300 hover:shadow-md group"
            >
              <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">رجوع</span>
            </button>

            <div className="text-center">
              <h1 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">تشغيل المسار</h1>
              {vehicle && (
                <p className="text-sm text-gray-500 mt-1">
                  {vehicle.name} {vehicle.plateNumber ? `- ${vehicle.plateNumber}` : ''} {vehicle.driverName ? `| السائق: ${vehicle.driverName}` : ''}
                </p>
              )}
            </div>

            <div className="w-[120px]"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900">اختيار اليوم</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDayChange(-1)}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label="اليوم السابق"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDayChange(1)}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label="اليوم التالي"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-700 font-medium mb-2">{formattedDate}</p>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  وقت البداية
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  وقت النهاية
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </label>
            </div>
            <button
              onClick={fetchTrackingPoints}
              disabled={isLoading}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              <MapPin className="w-5 h-5" />
              {isLoading ? 'جار التحميل...' : 'تحميل المسار'}
            </button>
            {error && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900">أيام بها حركة</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchMovementDays()}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label="تحديث الأيام"
                  title="تحديث الأيام"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setFilterYear(y => y - 1)}
                    className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 border-l border-gray-200"
                    aria-label="السنة السابقة"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-semibold text-gray-700 bg-gray-50">
                    {filterYear}
                  </span>
                  <button
                    onClick={() => setFilterYear(y => y + 1)}
                    className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 border-r border-gray-200"
                    aria-label="السنة التالية"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setFilterMonth(m => (m <= 1 ? 12 : m - 1))}
                    className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 border-l border-gray-200"
                    aria-label="الشهر السابق"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-semibold text-gray-700 bg-gray-50 min-w-[92px] text-center">
                    {monthLabel}
                  </span>
                  <button
                    onClick={() => setFilterMonth(m => (m >= 12 ? 1 : m + 1))}
                    className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 border-r border-gray-200"
                    aria-label="الشهر التالي"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {filteredMovementDays.length === 0 ? (
              <p className="text-sm text-gray-500">لا توجد بيانات حركة للفترة المحددة.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {filteredMovementDays.map(d => (
                  <button
                    key={d.date}
                    onClick={() => {
                      const [year, month, day] = d.date.split('-').map(Number);
                      setSelectedDate(new Date(year, month - 1, day));
                      setStartTime(new Date(d.start).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }));
                      setEndTime(new Date(d.end).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }));
                      setFilterYear(year);
                      setFilterMonth(month);
                    }}
                    className="w-full text-right px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all bg-white/70"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(d.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="font-semibold text-gray-900">{formatRange(d.start, d.end)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold">
                          نقاط: {d.count} / حركة: {d.movingCount}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 hover:shadow-2xl transition-shadow duration-300">
          <div
            ref={mapContainerRef}
            className="w-full"
            style={{
              height: '620px',
              minHeight: '620px',
              width: '100%',
              position: 'relative',
              zIndex: 0,
              backgroundColor: '#f3f4f6'
            }}
          >
            {isPlaying && (
              <div className="absolute top-4 left-4 z-1000 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-200/50 flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                </div>
                <span className="text-sm font-semibold text-gray-700">تشغيل</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-gray-900">التشغيل</h2>
          </div>

          <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
            <span>النقاط: {trackingPoints.length}</span>
            <span>التقدم: {progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={startPlayback}
              disabled={!trackingPoints.length || isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              <Play className="w-5 h-5" />
              تشغيل
            </button>
            <button
              onClick={() => {
                stopPlayback();
                setCurrentIndex(0);
                setShowFinishedModal(false);
                if (trackingPoints.length && mapRef.current && leafletRef.current) {
                  const first = [trackingPoints[0].latitude, trackingPoints[0].longitude] as [number, number];
                  markerRef.current?.setLatLng(first);
                  playbackPolylineRef.current?.setLatLngs([first]);
                }
              }}
              disabled={isLoading}
              className="px-4 py-3 inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-800 rounded-xl font-semibold border border-gray-200 hover:bg-gray-200 transition-all disabled:opacity-60"
            >
              <RotateCw className="w-5 h-5" />
              إعادة تعيين
            </button>
          </div>

          {trackingPoints.length === 0 && !isLoading && (
            <p className="mt-4 text-sm text-gray-500">حمّل المسار لليوم والوقت المحددين ثم اضغط تشغيل.</p>
          )}
        </div>
      </div>

      {showFinishedModal && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">تم إنهاء تشغيل المسار</h3>
            <p className="text-gray-600">يمكنك إعادة التشغيل أو العودة.</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowFinishedModal(false);
                  startPlayback();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <RotateCw className="w-5 h-5" />
                إعادة التشغيل
              </button>
              <button
                onClick={() => setShowFinishedModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold border border-gray-200 hover:bg-gray-200 transition-all"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlaybackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <PlaybackPageContent />
    </Suspense>
  );
}
