import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

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
    // الحصول على المستخدم الحالي
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

    // التحقق من الملكية - USER يمكنه رؤية فقط مركباته
    if (userRole !== 'ADMIN' && vehicle.userId !== userId) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول إلى هذه المركبة' },
        { status: 403 }
      );
    }

    // جلب آخر نقطة تتبع
    // استخدام createdAt بدلاً من timestamp لأن timestamp قد يكون من المستقبل (bug شائع في أجهزة GPS)
    // createdAt = source of truth (وقت الإدخال الفعلي في قاعدة البيانات)
    const lastTrackingPoint = await prisma.trackingPoint.findFirst({
      where: { vehicleId: parseInt(id) },
      orderBy: { createdAt: 'desc' } // ✅ الأحدث حسب وقت الإدخال، ليس GPS time
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
    // الحصول على المستخدم الحالي
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
    const { id } = await params;

    // التحقق من الملكية قبل التحديث
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    if (userRole !== 'ADMIN' && existingVehicle.userId !== userId) {
      return NextResponse.json(
        { error: 'غير مصرح بتعديل هذه المركبة' },
        { status: 403 }
      );
    }

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
    // الحصول على المستخدم الحالي
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
    const { id } = await params;
    const vehicleId = parseInt(id);

    // التحقق من الملكية قبل الحذف
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    if (userRole !== 'ADMIN' && existingVehicle.userId !== userId) {
      return NextResponse.json(
        { error: 'غير مصرح بحذف هذه المركبة' },
        { status: 403 }
      );
    }

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

