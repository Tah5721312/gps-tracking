import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// دالة للتحقق من آخر تحديث GPS وتحديث الحالة تلقائياً
async function checkAndUpdateVehicleStatus(vehicle: any) {
  const GPS_TIMEOUT_MINUTES = 5; // إذا لم يصل تحديث GPS لمدة 5 دقائق، تصبح المركبة مطفأة
  const now = new Date();
  
  // إذا لم يكن هناك lastUpdate، المركبة مطفأة
  if (!vehicle.lastUpdate) {
    if (vehicle.status !== 'turnoff') {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: 'turnoff' as any }
      });
      vehicle.status = 'turnoff';
    }
    return vehicle;
  }

  // حساب الفرق بالدقائق
  const lastUpdate = new Date(vehicle.lastUpdate);
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

  // إذا مر أكثر من 5 دقائق بدون تحديث، تصبح المركبة مطفأة
  if (minutesSinceUpdate > GPS_TIMEOUT_MINUTES && vehicle.status !== 'turnoff') {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: 'turnoff' as any }
    });
    vehicle.status = 'turnoff';
  }

  return vehicle;
}

// GET: جلب جميع المركبات
export async function GET(request: NextRequest) {
  try {
    // محاولة جلب البيانات بدون trackingPoints أولاً للتأكد من الاتصال
    const vehicles = await prisma.vehicle.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    // جلب آخر نقطة تتبع لكل مركبة والتحقق من الحالة
    const vehiclesWithTracking = await Promise.all(
      vehicles.map(async (vehicle: { id: number }) => {
        const lastTrackingPoint = await prisma.trackingPoint.findFirst({
          where: { vehicleId: vehicle.id },
          orderBy: { timestamp: 'desc' }
        });
        
        // التحقق من آخر تحديث GPS وتحديث الحالة تلقائياً
        const updatedVehicle = await checkAndUpdateVehicleStatus(vehicle);
        
        return {
          ...updatedVehicle,
          trackingPoints: lastTrackingPoint ? [lastTrackingPoint] : [],
          latestTrackingPoint: lastTrackingPoint
        };
      })
    );

    return NextResponse.json({ vehicles: vehiclesWithTracking });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch vehicles',
        details: errorMessage,
        message: 'Please check your database connection and ensure DATABASE_URL is set correctly'
      },
      { status: 500 }
    );
  }
}

// POST: إضافة مركبة جديدة
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const vehicle = await prisma.vehicle.create({
      data: {
        name: data.name,
        plateNumber: data.plateNumber,
        deviceImei: data.deviceImei,
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
        status: 'turnoff' as any // Temporary until Prisma Client is regenerated
      } as any, // Temporary until Prisma Client is regenerated
    });

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}