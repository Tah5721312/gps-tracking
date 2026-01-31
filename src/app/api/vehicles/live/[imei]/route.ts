import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// GET: جلب آخر حالة مركبة بناءً على IMEI
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imei: string }> }
) {
  try {
    // التحقق من الجلسة
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    const userId = parseInt(user.id as string);
    const userRole = user.role as string;

    const { imei } = await params;

    // البحث عن المركبة بناءً على IMEI
    const vehicle = await prisma.vehicle.findUnique({
      where: { deviceImei: imei },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      } as any
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // التحقق من الملكية - USER يمكنه رؤية فقط مركباته
    if (userRole !== 'ADMIN' && vehicle.userId !== userId) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول إلى هذه المركبة' },
        { status: 403 }
      );
    }

    // جلب آخر نقطة تتبع
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

    // معالجة driver بشكل صحيح
    let driverData = null;
    if (vehicle.driver && !Array.isArray(vehicle.driver)) {
      const driver = vehicle.driver as any;
      driverData = {
        id: driver.id,
        name: driver.name,
        phone: driver.phone
      };
    }

    return NextResponse.json({
      vehicleId: vehicle.id,
      imei: vehicle.deviceImei,
      latitude: vehicle.lastLatitude || 30.0444,
      longitude: vehicle.lastLongitude || 31.2357,
      speed: vehicle.lastSpeed || 0,
      batteryLevel: lastTrackingPoint?.batteryLevel ?? 100,
      status: status,
      lastUpdate: vehicle.lastUpdate || new Date(),
      driver: driverData
    });
  } catch (error) {
    console.error('Error fetching vehicle live data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle live data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

