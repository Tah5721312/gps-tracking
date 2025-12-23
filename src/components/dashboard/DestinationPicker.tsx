'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import type L from 'leaflet';

interface DestinationPickerProps {
  destinationLat: string;
  destinationLng: string;
  destinationName: string;
  onLatChange: (lat: string) => void;
  onLngChange: (lng: string) => void;
  onNameChange: (name: string) => void;
}

export default function DestinationPicker({
  destinationLat,
  destinationLng,
  destinationName,
  onLatChange,
  onLngChange,
  onNameChange,
}: DestinationPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // تحميل Leaflet ديناميكياً - تهيئة الخريطة فقط
  useEffect(() => {
    if (typeof window === 'undefined' || !showMap) {
      // تنظيف الخريطة عند إخفائها
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // تجاهل الأخطاء عند إزالة الخريطة
        }
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    // منع إعادة التهيئة إذا كانت الخريطة موجودة بالفعل
    if (mapRef.current) return;

    const loadLeaflet = async () => {
      try {
        await import('leaflet/dist/leaflet.css');
        const leaflet = await import('leaflet');
        const L = leaflet.default;
        leafletRef.current = L;
        
        // إصلاح أيقونات Leaflet الافتراضية
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // انتظار حتى يكون container جاهزاً
        if (!mapContainerRef.current) return;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mapContainerRef.current || mapRef.current) return;

        // تحديد الموقع الابتدائي
        const initialLat = destinationLat ? parseFloat(destinationLat) : 30.0444;
        const initialLng = destinationLng ? parseFloat(destinationLng) : 31.2357;
        const initialZoom = (destinationLat && destinationLng) ? 15 : 13;

        // تهيئة الخريطة
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([initialLat, initialLng], initialZoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // إضافة علامة عند النقر على الخريطة
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          
          // تحديث العلامة أولاً على الخريطة مباشرة
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], {
              draggable: true,
            }).addTo(map);
            
            // عند سحب العلامة
            markerRef.current.on('dragend', (e: L.DragEndEvent) => {
              if (markerRef.current && mapRef.current) {
                const position = markerRef.current.getLatLng();
                onLatChange(position.lat.toFixed(6));
                onLngChange(position.lng.toFixed(6));
                reverseGeocode(position.lat, position.lng);
              }
            });
          }
          
          // تحديث البيانات بعد تحديث العلامة
          onLatChange(lat.toFixed(6));
          onLngChange(lng.toFixed(6));
          
          // البحث العكسي عن اسم المكان
          reverseGeocode(lat, lng);
        });

        mapRef.current = map;

        // إذا كانت هناك إحداثيات موجودة، ضع العلامة عليها
        if (destinationLat && destinationLng) {
          const lat = parseFloat(destinationLat);
          const lng = parseFloat(destinationLng);
          if (!isNaN(lat) && !isNaN(lng)) {
            markerRef.current = L.marker([lat, lng], {
              draggable: true,
            }).addTo(map);
            
            markerRef.current.on('dragend', (e: L.DragEndEvent) => {
              if (markerRef.current && mapRef.current) {
                const position = markerRef.current.getLatLng();
                onLatChange(position.lat.toFixed(6));
                onLngChange(position.lng.toFixed(6));
                reverseGeocode(position.lat, position.lng);
              }
            });
          }
        }

        // تحديث حجم الخريطة
        setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.invalidateSize();
            } catch (e) {
              // تجاهل الأخطاء
            }
          }
        }, 200);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // تجاهل الأخطاء
        }
        mapRef.current = null;
        markerRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [showMap]); // إزالة destinationLat و destinationLng من dependencies

  // البحث العكسي (Reverse Geocoding) - الحصول على اسم المكان من الإحداثيات
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`,
        {
          headers: {
            'User-Agent': 'GPS-Tracking-App/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data.display_name) {
        // تحسين اسم المكان
        const address = data.address || {};
        let name = data.display_name;
        
        // محاولة إنشاء اسم أفضل من تفاصيل العنوان
        if (address.road || address.house_number) {
          const parts = [];
          if (address.house_number) parts.push(address.house_number);
          if (address.road) parts.push(address.road);
          if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
          if (parts.length > 0) {
            name = parts.join('، ');
          }
        } else if (address.building || address.amenity) {
          name = address.building || address.amenity;
          if (address.road) name += ` - ${address.road}`;
        }
        
        // التأكد من استدعاء onNameChange
        onNameChange(name);
      } else {
        // إذا لم يتم العثور على اسم، استخدم الإحداثيات
        onNameChange(`موقع: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // في حالة الخطأ، استخدم الإحداثيات كاسم
      onNameChange(`موقع: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  }, [onNameChange]);

  // البحث عن مكان (Geocoding) مع تحسينات
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // استخدام بحث محسّن مع دعم اللغة العربية
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&accept-language=ar&countrycodes=eg&bounded=1&viewbox=31.0,29.5,32.0,30.5&extratags=1`,
        {
          headers: {
            'User-Agent': 'GPS-Tracking-App/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      // تحسين النتائج
      const improvedResults = data.map((result: any) => {
        const address = result.address || {};
        let displayName = result.display_name;
        
        // تحسين اسم العرض
        if (address.road || address.house_number) {
          const parts = [];
          if (address.house_number) parts.push(address.house_number);
          if (address.road) parts.push(address.road);
          if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
          if (address.city || address.town) parts.push(address.city || address.town);
          if (parts.length > 0) {
            displayName = parts.join('، ');
          }
        }
        
        return {
          ...result,
          improvedName: displayName,
          type: result.type || address.amenity || address.place_type || 'مكان',
          importance: result.importance || 0
        };
      }).sort((a: any, b: any) => b.importance - a.importance);
      
      setSearchResults(improvedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // البحث مع debounce (تأخير للبحث التلقائي)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    // إلغاء البحث السابق
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // البحث بعد 500ms من توقف الكتابة
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 500);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, []);

  // البحث عند الضغط على Enter
  const handleSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    performSearch(searchQuery);
  };

  // اختيار نتيجة من البحث
  const selectSearchResult = async (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onLatChange(lat.toFixed(6));
    onLngChange(lng.toFixed(6));
    onNameChange(result.improvedName || result.display_name || result.name || searchQuery);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    
    // تحديث الخريطة
    if (leafletRef.current && mapRef.current) {
      const L = leafletRef.current;
      mapRef.current.setView([lat, lng], 15);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
        }).addTo(mapRef.current);
        
        markerRef.current.on('dragend', (e: L.DragEndEvent) => {
          if (markerRef.current) {
            const position = markerRef.current.getLatLng();
            onLatChange(position.lat.toFixed(6));
            onLngChange(position.lng.toFixed(6));
            reverseGeocode(position.lat, position.lng);
          }
        });
      }
    }
    
    setShowMap(true);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          البحث عن الوجهة
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              onBlur={() => {
                // تأخير إخفاء النتائج للسماح بالنقر عليها
                setTimeout(() => setShowResults(false), 200);
              }}
              placeholder="ابحث عن مكان (مثال: القاهرة، الإسكندرية، مستودع، شارع النيل...)"
              className="w-full px-3 py-2 pr-10 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}
          </button>
        </div>
        
        {/* نتائج البحث */}
        {showResults && searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-xl max-h-64 overflow-y-auto z-50">
            {searchResults.map((result, index) => (
              <button
                key={`${result.place_id || index}-${result.lat}-${result.lon}`}
                onClick={() => selectSearchResult(result)}
                onMouseDown={(e) => e.preventDefault()} // منع onBlur من إغلاق القائمة
                className="w-full px-4 py-3 text-right hover:bg-blue-50 transition text-sm border-b last:border-b-0 flex items-start gap-3"
              >
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 text-right">
                  <div className="font-medium text-gray-900">
                    {result.improvedName || result.display_name}
                  </div>
                  {result.display_name !== result.improvedName && (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {result.display_name}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                    <span>{result.type}</span>
                    <span>•</span>
                    <span>{parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* رسالة عند عدم وجود نتائج */}
        {showResults && !isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div className="mt-2 p-4 text-center text-gray-500 text-sm border border-gray-200 rounded-lg bg-gray-50">
            لم يتم العثور على نتائج لـ "{searchQuery}"
          </div>
        )}
      </div>

      {/* الخريطة */}
      {showMap && (
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-md">
          <div 
            ref={mapContainerRef} 
            className="w-full h-64"
            style={{ minHeight: '256px' }}
          />
          <div className="p-2 bg-gray-50 text-xs text-gray-600 text-center border-t">
            💡 انقر على الخريطة لاختيار الوجهة أو اسحب العلامة لتعديل الموقع
          </div>
        </div>
      )}

      {/* عرض الإحداثيات المحددة */}
      {(destinationLat || destinationLng) && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">
                {destinationName || 'موقع محدد'}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {destinationLat && destinationLng && (
                  <>إحداثيات: {destinationLat}, {destinationLng}</>
                )}
              </p>
            </div>
            {(destinationLat || destinationLng) && (
              <button
                onClick={() => {
                  onLatChange('');
                  onLngChange('');
                  onNameChange('');
                  if (markerRef.current && mapRef.current) {
                    mapRef.current.removeLayer(markerRef.current);
                    markerRef.current = null;
                  }
                }}
                className="text-red-600 hover:text-red-800"
                title="مسح الوجهة"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

