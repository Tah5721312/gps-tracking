import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

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

    // بناء شرط where - ADMIN يرى كل المركبات، USER يرى فقط مركباته
    const whereClause: any = {};
    if (userRole !== 'ADMIN') {
      whereClause.userId = userId;
    }

    // محاولة جلب البيانات بدون trackingPoints أولاً للتأكد من الاتصال
    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      } as any,
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

    // التحقق من صحة userId
    if (isNaN(userId) || userId <= 0) {
      console.error('Invalid userId from session:', user.id);
      return NextResponse.json(
        { error: 'خطأ في بيانات المستخدم' },
        { status: 401 }
      );
    }

    // التحقق من وجود المستخدم في قاعدة البيانات
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true }
    });

    if (!existingUser) {
      console.error('User not found in database:', userId);
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    if (!existingUser.isActive) {
      return NextResponse.json(
        { error: 'حساب المستخدم غير نشط' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // التحقق من البيانات المطلوبة
    if (!data.name || !data.deviceImei) {
      return NextResponse.json(
        { error: 'اسم المركبة ورقم IMEI مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من وجود deviceImei مسبقاً
    const existingVehicleByImei = await prisma.vehicle.findUnique({
      where: { deviceImei: data.deviceImei }
    });

    if (existingVehicleByImei) {
      return NextResponse.json(
        { error: 'رقم IMEI مستخدم بالفعل' },
        { status: 400 }
      );
    }


    const vehicle = await prisma.vehicle.create({
      data: {
        name: data.name,
        plateNumber: data.plateNumber && data.plateNumber.trim() !== '' ? data.plateNumber.trim() : null,
        deviceImei: data.deviceImei,
        userId: userId, // ربط المركبة بالمستخدم الحالي
        driverId: data.driverId || null,
        status: 'turnoff' as any
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
  } catch (error: any) {
    console.error('Error creating vehicle:', error);

    // معالجة أخطاء Prisma بشكل أفضل
    if (error.code === 'P2003') {
      const field = error.meta?.field_name;
      if (field === 'userId' || field?.includes('userId')) {
        return NextResponse.json(
          { error: 'المستخدم غير موجود في قاعدة البيانات' },
          { status: 404 }
        );
      }
    }

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'deviceImei') {
        return NextResponse.json(
          { error: 'رقم IMEI مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المركبة', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}