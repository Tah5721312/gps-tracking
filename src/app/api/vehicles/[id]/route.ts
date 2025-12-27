import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// دالة للتحقق من آخر تحديث GPS وتحديث الحالة تلقائياً
async function checkAndUpdateVehicleStatus(vehicle: any) {
  const GPS_TIMEOUT_MINUTES = 5; // إذا لم يصل تحديث GPS لمدة 5 دقائق، تصبح المركبة مطفأة
  const now = new Date();
  
  // إذا لم يكن هناك lastUpdate، المركبة مطفأة مع سرعة 0
  if (!vehicle.lastUpdate) {
    if (vehicle.status !== 'turnoff') {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: 'turnoff' as any, lastSpeed: 0 }
      });
      vehicle.status = 'turnoff';
      vehicle.lastSpeed = 0;
    }
    return vehicle;
  }

  // حساب الفرق بالدقائق
  const lastUpdate = new Date(vehicle.lastUpdate);
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

  // إذا مر أكثر من 5 دقائق بدون تحديث، تصبح المركبة مطفأة وتُصفّر السرعة
  if (minutesSinceUpdate > GPS_TIMEOUT_MINUTES && vehicle.status !== 'turnoff') {
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: 'turnoff' as any, lastSpeed: 0 }
    });
    vehicle.status = 'turnoff';
    vehicle.lastSpeed = 0;
  }

  return vehicle;
}

// GET: جلب مركبة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) },
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

    // جلب آخر نقطة تتبع
    const lastTrackingPoint = await prisma.trackingPoint.findFirst({
      where: { vehicleId: parseInt(id) },
      orderBy: { timestamp: 'desc' }
    });

    // التحقق من آخر تحديث GPS وتحديث الحالة تلقائياً
    const updatedVehicle = await checkAndUpdateVehicleStatus(vehicle);

    return NextResponse.json({ 
      vehicle: {
        ...updatedVehicle,
        latestTrackingPoint: lastTrackingPoint
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

// PUT: تحديث مركبة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        plateNumber: data.plateNumber,
        deviceImei: data.deviceImei,
        driverId: data.driverId || null,
        status: data.status || 'turnoff'
      } as any,
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

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: حذف مركبة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id);
    
    // حذف جميع نقاط التتبع المرتبطة
    await prisma.trackingPoint.deleteMany({
      where: { vehicleId: vehicleId }
    });

    // حذف جميع التقارير اليومية المرتبطة
    await prisma.dailyReport.deleteMany({
      where: { vehicleId: vehicleId }
    });

    // حذف المركبة
    await prisma.vehicle.delete({
      where: { id: vehicleId }
    });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

