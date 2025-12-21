import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب جميع الرحلات مع إمكانية الفلترة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};
    
    if (vehicleId) {
      whereClause.vehicleId = parseInt(vehicleId);
    }
    
    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            driverName: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: إنشاء رحلة جديدة
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!data.vehicleId || !data.startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, startTime' },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        vehicleId: parseInt(data.vehicleId),
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        distance: parseFloat(data.distance || 0),
        avgSpeed: parseFloat(data.avgSpeed || 0),
        maxSpeed: parseFloat(data.maxSpeed || 0),
        stops: parseInt(data.stops || 0),
        notes: data.notes || null,
        destinationLat: data.destinationLat ? parseFloat(data.destinationLat) : null,
        destinationLng: data.destinationLng ? parseFloat(data.destinationLng) : null,
        destinationName: data.destinationName || null,
        arrivalStatus: (data.destinationLat && data.destinationLng) ? 'in_progress' : 'not_set'
      } as any, // Temporary until Prisma Client is regenerated
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            driverName: true
          }
        }
      }
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

