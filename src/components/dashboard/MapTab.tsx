'use client';



import React from 'react';

import { Truck, MapPin, Clock } from 'lucide-react';

import dynamic from 'next/dynamic';



const MapComponent = dynamic(() => import('@/components/MapComponent'), {

  ssr: false,

  loading: () => (

    <div className="w-full h-full flex items-center justify-center bg-gray-100">

      <div className="text-center">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>

        <p className="text-gray-600">جاري تحميل الخريطة...</p>

      </div>

    </div>

  )

});



interface Vehicle {

  id: number;

  name: string;

  plate: string;

  deviceImei: string;

  lat: number;

  lng: number;

  speed: number;

  status: 'moving' | 'stopped' | 'turnoff';

  driver: string;

  driverPhone?: string;

  lastUpdate: Date;

  battery: number;

  createdAt: Date;

  stoppedAt?: Date | null;

  totalStoppedTime?: number;

  currentStoppedTime?: number;

}



interface MapTabProps {

  vehicles: Vehicle[];

  selectedVehicle: Vehicle | null;

  filter: string;

  loading: boolean;

  onFilterChange: (filter: string) => void;

  onVehicleClick: (vehicle: Vehicle) => void;

  getStatusColor: (status: string) => string;

  getStatusText: (status: string) => string;

  formatStoppedTime: (seconds: number) => string;

  getTotalStoppedTime: (vehicle: Vehicle) => number;

}



export default function MapTab({

  vehicles,

  selectedVehicle,

  filter,

  loading,

  onFilterChange,

  onVehicleClick,

  getStatusColor,

  getStatusText,

  formatStoppedTime,

  getTotalStoppedTime

}: MapTabProps) {

  const filteredVehicles = vehicles.filter(v =>

    filter === 'all' || v.status === filter

  );



  return (

    <div className="p-3 sm:p-4 md:p-6">

      {/* فلتر */}

      <div className="mb-4 flex flex-wrap gap-2">

        <button

          onClick={() => onFilterChange('all')}

          className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

            }`}

        >

          الكل ({vehicles.length})

        </button>

        <button

          onClick={() => onFilterChange('moving')}

          className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${filter === 'moving' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

            }`}

        >

          متحركة ({vehicles.filter(v => v.status === 'moving').length})

        </button>

        <button

          onClick={() => onFilterChange('stopped')}

          className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${filter === 'stopped' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

            }`}

        >

          متوقفة ({vehicles.filter(v => v.status === 'stopped').length})

        </button>

        <button

          onClick={() => onFilterChange('turnoff')}

          className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm sm:text-base ${filter === 'turnoff' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

            }`}

        >

          مطفأة ({vehicles.filter(v => v.status === 'turnoff').length})

        </button>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

        {/* قائمة المركبات */}

        <div className="lg:col-span-1 space-y-3 max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] overflow-y-auto">

          {loading ? (

            <div className="p-4 text-center text-gray-500">جاري التحميل...</div>

          ) : filteredVehicles.length === 0 ? (

            <div className="p-4 text-center text-gray-500">لا توجد مركبات</div>

          ) : (

            filteredVehicles.map(vehicle => (

              <div

                key={vehicle.id}

                onClick={() => onVehicleClick(vehicle)}

                className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition ${selectedVehicle?.id === vehicle.id

                  ? 'border-blue-600 bg-blue-50 shadow-md'

                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow'

                  }`}

              >

                <div className="flex items-start justify-between mb-2 sm:mb-3">

                  <div className="flex items-center gap-2">

                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />

                    <div>

                      <h3 className="font-bold text-sm sm:text-base text-gray-900">{vehicle.name}</h3>

                      <p className="text-xs sm:text-sm text-gray-600">{vehicle.plate}</p>

                    </div>

                  </div>

                  <span className={`px-2 py-1 rounded-full text-xs text-white whitespace-nowrap ${getStatusColor(vehicle.status)}`}>

                    {getStatusText(vehicle.status)}

                  </span>

                </div>



                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">

                  <div className="flex justify-between items-center">

                    <span className="text-gray-600">المالك:</span>

                    <span className="font-medium text-right wrap-break-word">{vehicle.driver}</span>

                  </div>

                  {vehicle.driverPhone && (

                    <div className="flex justify-between items-center">

                      <span className="text-gray-600">رقم الهاتف:</span>

                      <span className="font-medium text-xs text-right break-all">{vehicle.driverPhone}</span>

                    </div>

                  )}

                  <div className="flex justify-between items-center">

                    <span className="text-gray-600">IMEI:</span>

                    <span className="font-medium text-xs text-right break-all">{vehicle.deviceImei}</span>

                  </div>

                  <div className="flex justify-between items-center">

                    <span className="text-gray-600">أخر سرعة:</span>

                    <span className="font-medium">{Math.round(vehicle.speed)} كم/س</span>

                  </div>

                  <div className="flex justify-between items-center">

                    <span className="text-gray-600">البطارية:</span>

                    <div className="flex items-center gap-2">

                      <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden">

                        <div

                          className={`h-full transition-all ${vehicle.battery > 50 ? 'bg-green-500' :

                            vehicle.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'

                            }`}

                          style={{ width: `${vehicle.battery}%` }}

                        />

                      </div>

                      <span className="font-medium text-xs">{Math.round(vehicle.battery)}%</span>

                    </div>

                  </div>

                  {vehicle.status === 'stopped' && (

                    <div className="flex justify-between items-center pt-1">

                      <span className="text-gray-600 flex items-center gap-1">

                        <Clock className="w-3 h-3" />

                        <span className="whitespace-nowrap">وقت الوقوف:</span>

                      </span>

                      <span className="font-medium text-xs text-orange-600">

                        {formatStoppedTime(getTotalStoppedTime(vehicle))}

                      </span>

                    </div>

                  )}

                  <p className="hidden sm:block text-xs text-gray-400 pt-1.5 sm:pt-2 border-t border-gray-200">

                    آخر تحديث: {vehicle.lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}

                  </p>

                </div>

              </div>

            ))

          )}

        </div>



        {/* الخريطة - Leaflet + OpenStreetMap */}

        <div className="lg:col-span-4 rounded-lg min-h-[400px] h-[400px] sm:min-h-[500px] sm:h-[500px] lg:min-h-[600px] lg:h-[600px] relative overflow-hidden border-2 border-gray-300 shadow-lg">

          <MapComponent

            vehicles={vehicles}

            selectedVehicle={selectedVehicle}

            onVehicleClick={onVehicleClick}

          />

        </div>

      </div>


    </div>

  );

}



