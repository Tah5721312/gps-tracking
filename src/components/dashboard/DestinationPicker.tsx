'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // تحميل Leaflet ديناميكياً
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      const L = await import('leaflet');
      
      // إصلاح أيقونات Leaflet الافتراضية
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // تهيئة الخريطة
      if (mapContainerRef.current && !mapRef.current) {
        const map = L.map(mapContainerRef.current).setView([30.0444, 31.2357], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // إضافة علامة عند النقر على الخريطة
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          onLatChange(lat.toFixed(6));
          onLngChange(lng.toFixed(6));
          
          // تحديث أو إضافة علامة
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], {
              draggable: true,
            }).addTo(map);
            
            // عند سحب العلامة
            markerRef.current.on('dragend', (e: L.DragEndEvent) => {
              if (markerRef.current) {
                const position = markerRef.current.getLatLng();
                onLatChange(position.lat.toFixed(6));
                onLngChange(position.lng.toFixed(6));
                reverseGeocode(position.lat, position.lng);
              }
            });
          }
          
          // البحث العكسي عن اسم المكان
          reverseGeocode(lat, lng);
        });

        mapRef.current = map;

        // إذا كانت هناك إحداثيات موجودة، ضع العلامة عليها
        if (destinationLat && destinationLng) {
          const lat = parseFloat(destinationLat);
          const lng = parseFloat(destinationLng);
          if (!isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], 15);
            markerRef.current = L.marker([lat, lng], {
              draggable: true,
            }).addTo(map);
            
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
      }
    };

    if (showMap) {
      loadLeaflet();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap, destinationLat, destinationLng]);

  // البحث العكسي (Reverse Geocoding) - الحصول على اسم المكان من الإحداثيات
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GPS-Tracking-App'
          }
        }
      );
      const data = await response.json();
      
      if (data.display_name) {
        // استخراج اسم المكان (يمكن تحسينه حسب الحاجة)
        const name = data.display_name.split(',')[0] || data.display_name;
        onNameChange(name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  // البحث عن مكان (Geocoding)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GPS-Tracking-App'
          }
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // اختيار نتيجة من البحث
  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onLatChange(lat.toFixed(6));
    onLngChange(lng.toFixed(6));
    onNameChange(result.display_name || result.name || searchQuery);
    setSearchQuery('');
    setSearchResults([]);
    
    // تحديث الخريطة
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const L = require('leaflet');
        const marker = L.marker([lat, lng], {
          draggable: true,
        }).addTo(mapRef.current);
        
        marker.on('dragend', (e: L.DragEndEvent) => {
          const position = marker.getLatLng();
          onLatChange(position.lat.toFixed(6));
          onLngChange(position.lng.toFixed(6));
          reverseGeocode(position.lat, position.lng);
        });
        
        markerRef.current = marker;
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
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="ابحث عن مكان (مثال: القاهرة، الإسكندرية، مستودع...)"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Search className="w-4 h-4" />
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
        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectSearchResult(result)}
                className="w-full px-4 py-3 text-right hover:bg-blue-50 transition text-sm border-b last:border-b-0"
              >
                <div className="font-medium text-gray-900">{result.display_name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* الخريطة */}
      {showMap && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-64" />
          <div className="p-2 bg-gray-50 text-xs text-gray-600 text-center">
            انقر على الخريطة لاختيار الوجهة أو اسحب العلامة لتعديل الموقع
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

