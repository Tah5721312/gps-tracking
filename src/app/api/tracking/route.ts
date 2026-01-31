import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// GET: جلب نقاط التتبع لمركبة معينة
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') || '100';

    const whereClause: any = {};

    if (vehicleId) {
      const vehicleIdNum = parseInt(vehicleId);

      // التحقق من الملكية إذا لم يكن ADMIN
      if (userRole !== 'ADMIN') {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: vehicleIdNum },
          select: { userId: true },
        });

        if (!vehicle) {
          return NextResponse.json(
            { error: 'المركبة غير موجودة' },
            { status: 404 }
          );
        }

        if (vehicle.userId !== userId) {
          return NextResponse.json(
            { error: 'غير مصرح بالوصول إلى هذه المركبة' },
            { status: 403 }
          );
        }
      }

      whereClause.vehicleId = vehicleIdNum;
    } else {
      // إذا لم يتم تحديد vehicleId، يجب أن يكون ADMIN أو نرجع فقط مركبات المستخدم
      if (userRole !== 'ADMIN') {
        // جلب فقط نقاط التتبع لمركبات المستخدم
        const userVehicles = await prisma.vehicle.findMany({
          where: { userId },
          select: { id: true },
        });
        const vehicleIds = userVehicles.map(v => v.id);
        whereClause.vehicleId = { in: vehicleIds };
      }
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const trackingPoints = await prisma.trackingPoint.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            driver: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      } as any,
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit)
    });

    return NextResponse.json({ trackingPoints });
  } catch (error) {
    console.error('Error fetching tracking points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking points' },
      { status: 500 }
    );
  }
}

