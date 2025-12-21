import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب جميع المركبات
export async function GET(request: NextRequest) {
  try {
    // محاولة جلب البيانات بدون trackingPoints أولاً للتأكد من الاتصال
    const vehicles = await prisma.vehicle.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    // جلب آخر نقطة تتبع لكل مركبة
    const vehiclesWithTracking = await Promise.all(
      vehicles.map(async (vehicle: { id: number }) => {
        const lastTrackingPoint = await prisma.trackingPoint.findFirst({
          where: { vehicleId: vehicle.id },
          orderBy: { timestamp: 'desc' }
        });
        return {
          ...vehicle,
          trackingPoints: lastTrackingPoint ? [lastTrackingPoint] : []
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