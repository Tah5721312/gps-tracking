import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب آخر حالة لجميع المركبات (للخريطة)
export async function GET(request: NextRequest) {
  try {
    // جلب جميع المركبات (بدون driver - غير مستخدم في response)
    const vehicles = await prisma.vehicle.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    // جلب آخر نقطة تتبع لكل مركبة
    const vehiclesWithLiveData = await Promise.all(
      vehicles.map(async (vehicle) => {
        const lastTrackingPoint = await prisma.trackingPoint.findFirst({
          where: { vehicleId: vehicle.id },
          orderBy: { timestamp: 'desc' }
        });

        // التحقق من آخر تحديث GPS وتحديث الحالة تلقائياً
        const GPS_TIMEOUT_MINUTES = 5;
        const now = new Date();
        let status = vehicle.status || 'turnoff';

        if (vehicle.lastUpdate) {
          const lastUpdate = new Date(vehicle.lastUpdate);
          const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

          // إذا مر أكثر من 5 دقائق بدون تحديث، تصبح المركبة مطفأة
          if (minutesSinceUpdate > GPS_TIMEOUT_MINUTES) {
            status = 'turnoff';
          } else {
            // استخدام الحالة المحفوظة (moving/stopped)
            status = vehicle.status || 'stopped';
          }
        }

        return {
          imei: vehicle.deviceImei,
          lat: vehicle.lastLatitude || 30.0444,
          lng: vehicle.lastLongitude || 31.2357,
          speed: vehicle.lastSpeed || 0,
          batteryLevel: lastTrackingPoint?.batteryLevel ?? 100,
          status: status,
          lastUpdate: vehicle.lastUpdate || new Date()
        };
      })
    );

    return NextResponse.json(vehiclesWithLiveData);
  } catch (error) {
    console.error('Error fetching vehicles live data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles live data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

